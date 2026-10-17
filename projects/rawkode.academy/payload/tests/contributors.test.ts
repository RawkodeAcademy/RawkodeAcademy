import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Field } from 'payload'
import { contributorPerson, isContributor, isStaff, sessionRole } from '../src/auth/access'
import { contributorDraftsOnly, contributorGuard, lockNonContributorFields, peopleAccess } from '../src/auth/contributors'
import { createCollections } from '../src/collections'
import { actorFromUser } from '../src/review/contracts'

const staff = { id: 1, collection: 'users', role: 'staff' }
const guest = { id: 2, collection: 'users', role: 'guest', person: 42 }
const sponsor = { id: 3, collection: 'users', role: 'sponsor', person: { id: 43 } }
const unlinked = { id: 4, collection: 'users', role: 'sponsor', person: null }
const customer = { id: 5, collection: 'users', role: 'customer', person: 42 }

const req = (user: unknown, context: Record<string, unknown> = {}) => ({ user, context, t: (key: string) => key }) as never
const guard = (user: unknown, data: Record<string, unknown>, originalDoc: Record<string, unknown> = { id: 42, slug: 'ada', terms: [] }, operation = 'update') =>
  contributorGuard({ data, originalDoc, operation, req: req(user) } as never)

test('staff comes only from configuration; contributor roles survive sign-in', () => {
  assert.equal(sessionRole('customer', true), 'staff')
  assert.equal(sessionRole('staff', false), 'customer', 'a removed staff subject is demoted')
  assert.equal(sessionRole('guest', false), 'guest')
  assert.equal(sessionRole('sponsor', false), 'sponsor')
  assert.equal(sessionRole('admin', false), 'customer')
  assert.equal(sessionRole(undefined, false), 'customer')
})

test('only guests and sponsors are contributors, and only with a linked Person', () => {
  assert(isContributor(guest) && isContributor(sponsor) && isContributor(unlinked))
  assert(!isContributor(staff) && !isContributor(customer) && !isContributor(null))
  assert(!isStaff(guest) && !isStaff(sponsor))
  assert.equal(contributorPerson(guest), 42)
  assert.equal(contributorPerson(sponsor), 43)
  assert.equal(contributorPerson(unlinked), null)
  assert.equal(contributorPerson(customer), null, 'a customer never gets edit rights from a stray person link')
})

test('contributors may update only their own Person and read its drafts', () => {
  const update = peopleAccess!.update!
  assert.equal(update({ req: req(staff) } as never), true)
  assert.deepEqual(update({ req: req(guest) } as never), { id: { equals: 42 } })
  assert.equal(update({ req: req(unlinked) } as never), false)
  assert.equal(update({ req: req(customer) } as never), false)
  assert.equal(update({ req: req(null) } as never), false)
  assert.equal(peopleAccess!.create!({ req: req(guest) } as never), false)
  assert.equal(peopleAccess!.delete!({ req: req(sponsor) } as never), false)

  const read = peopleAccess!.read!
  assert.equal(read({ req: req(staff) } as never), true)
  const published = { and: [{ _status: { equals: 'published' } }, { tombstone: { equals: false } }] }
  assert.deepEqual(read({ req: req(null) } as never), published)
  assert.deepEqual(read({ req: req(guest) } as never), { or: [published, { id: { equals: 42 } }] })
  assert.deepEqual(peopleAccess!.readVersions!({ req: req(sponsor) } as never), { parent: { equals: 43 } })
  assert.equal(peopleAccess!.readVersions!({ req: req(customer) } as never), false)
})

test('contributor changes are drafts of profile fields only', () => {
  assert.deepEqual(guard(guest, { _status: 'draft', biography: 'Builds things.', links: [{ name: 'Blog', url: 'https://example.com' }] }), { _status: 'draft', biography: 'Builds things.', links: [{ name: 'Blog', url: 'https://example.com' }] })
  // Unchanged locked fields submitted by the admin form are fine.
  assert.doesNotThrow(() => guard(guest, { _status: 'draft', slug: 'ada', terms: [] }))
  assert.throws(() => guard(guest, { _status: 'published', biography: 'x' }), new RegExp(contributorDraftsOnly))
  assert.throws(() => guard(guest, { biography: 'x' }), new RegExp(contributorDraftsOnly), 'a non-draft save would overwrite the published profile')
  assert.throws(() => guard(guest, { _status: 'draft', slug: 'someone-else' }), /slug is managed by staff/)
  assert.throws(() => guard(sponsor, { _status: 'draft', terms: [{ value: 'best-in-class' }] }, { id: 43, terms: [] }), /terms is managed by staff/)
  assert.throws(() => guard(guest, { _status: 'draft' }, { id: 99 }), 'never another Person, even if access were misconfigured')
  assert.throws(() => guard(unlinked, { _status: 'draft' }))
  assert.throws(() => guard(guest, { _status: 'draft' }, undefined, 'create'))
  // Staff and machines are unaffected.
  assert.deepEqual(guard(staff, { _status: 'published', slug: 'renamed' }), { _status: 'published', slug: 'renamed' })
})

test('every Person field outside the profile allowlist is staff-only in the admin', () => {
  const people = createCollections({ localAuth: false } as never, {} as never).find(collection => collection.slug === 'people')!
  assert.equal(people.access, peopleAccess)
  assert.equal(people.hooks?.beforeChange?.[0], contributorGuard, 'the guard runs before editorial hooks')
  const named: Field[] = []
  const walk = (fields: Field[]) => {
    for (const field of fields) {
      if ('name' in field && field.name && field.type !== 'ui') named.push(field)
      else if ('fields' in field && Array.isArray(field.fields)) walk(field.fields)
      else if ('tabs' in field && Array.isArray(field.tabs)) for (const tab of field.tabs) walk(tab.fields)
    }
  }
  walk(people.fields)
  const updateAccess = (field: Field) => (field as { access?: { update?: (args: never) => unknown } }).access?.update
  const locked = (field: Field) => updateAccess(field)?.({ req: req(guest) } as never) === false
  for (const name of ['slug', 'legacyId', 'terms', 'tombstone', 'sourceData', 'editorialData'])
    assert(locked(named.find(field => 'name' in field && field.name === name)!), `${name} is locked`)
  for (const name of ['biography', 'links', 'bluesky', 'website', 'body'])
    assert(!locked(named.find(field => 'name' in field && field.name === name)!), `${name} is editable`)
  const field = named.find(candidate => 'name' in candidate && candidate.name === 'slug')!
  assert.equal(updateAccess(field)?.({ req: req(staff) } as never), true)
  assert.deepEqual(lockNonContributorFields([{ type: 'ui', name: 'panel', admin: {} } as Field]), [{ type: 'ui', name: 'panel', admin: {} }])
})

test('guests and sponsors review client videos as customers', () => {
  assert.deepEqual(actorFromUser(sponsor), { id: 3, collection: 'users', role: 'customer' })
  assert.deepEqual(actorFromUser(guest), { id: 2, collection: 'users', role: 'customer' })
  assert.deepEqual(actorFromUser(staff), { id: 1, collection: 'users', role: 'staff' })
  assert.throws(() => actorFromUser({ id: 6, collection: 'users', role: 'admin' }), /Sign in/)
})
