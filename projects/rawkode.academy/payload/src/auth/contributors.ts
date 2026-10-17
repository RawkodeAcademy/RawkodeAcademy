import { type Access, type CollectionBeforeChangeHook, type CollectionConfig, type Field, Forbidden, type Where } from 'payload'
import { contributorPerson, isContributor, isStaff } from './access'

// Guests and sponsors maintain their own Person profile. Editorial
// independence is enforced here, not in the UI: a contributor can only ever
// save a draft of the one Person linked to their account, can only change the
// fields below, and never publishes. Staff review the draft and publish it.
export const contributorFields = [
  'name', 'forename', 'surname',
  'github', 'twitter', 'bluesky', 'mastodon', 'linkedin', 'website', 'youtube',
  'githubHandle', 'githubUrl', 'avatarUrl', 'biography', 'links', 'body',
] as const

// Written by Payload itself on every save.
const systemFields = new Set(['id', '_status', 'createdAt', 'updatedAt', 'locallyEdited'])

const published: Where = { and: [{ _status: { equals: 'published' } }, { tombstone: { equals: false } }] }

export const contributorDraftsOnly =
  'Guest and sponsor changes are saved as drafts. Staff review and publish them.'

const ownPerson = (user: unknown): Where | false => {
  const person = contributorPerson(user)
  return person === null ? false : { id: { equals: person } }
}

export const peopleAccess: CollectionConfig['access'] = {
  read: ({ req }) => {
    if (isStaff(req.user) || req.context.pipelineMachine === true) return true
    const own = ownPerson(req.user)
    return own ? { or: [published, own] } : published
  },
  readVersions: ({ req }) => {
    if (isStaff(req.user) || req.context.pipelineMachine === true) return true
    const person = contributorPerson(req.user)
    return person === null ? false : { parent: { equals: person } }
  },
  update: ({ req }) => isStaff(req.user) || req.context.pipelineMachine === true || ownPerson(req.user),
  create: ({ req }) => isStaff(req.user) || req.context.pipelineMachine === true,
  delete: ({ req }) => isStaff(req.user) || req.context.pipelineMachine === true,
}

export const contributorGuard: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (!isContributor(req.user)) return data
  if (operation !== 'update' || contributorPerson(req.user) === null || Number(originalDoc?.id) !== contributorPerson(req.user)) {
    throw new Forbidden(req.t)
  }
  if (data._status !== 'draft') throw new Error(contributorDraftsOnly)
  const allowed = new Set<string>(contributorFields)
  for (const [field, value] of Object.entries(data)) {
    if (allowed.has(field) || systemFields.has(field)) continue
    if (JSON.stringify(value) !== JSON.stringify(originalDoc?.[field])) throw new Error(`${field} is managed by staff`)
  }
  return data
}

const staffOnlyUpdate: Access = ({ req }) => !isContributor(req.user)

// Field-level access makes everything else read-only in the admin for
// contributors; contributorGuard is the backstop for API writes.
export function lockNonContributorFields(fields: Field[]): Field[] {
  const allowed = new Set<string>(contributorFields)
  return fields.map(field => {
    if ('fields' in field && Array.isArray(field.fields) && !('name' in field && field.name)) {
      return { ...field, fields: lockNonContributorFields(field.fields) } as Field
    }
    if ('tabs' in field && Array.isArray(field.tabs)) {
      return { ...field, tabs: field.tabs.map(tab => ({ ...tab, fields: lockNonContributorFields(tab.fields) })) } as Field
    }
    if (!('name' in field) || !field.name || field.type === 'ui' || allowed.has(field.name)) return field
    return { ...field, access: { ...field.access, update: staffOnlyUpdate } } as Field
  })
}
