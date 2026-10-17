// Roles. Staff comes only from OIDC_STAFF_SUBJECTS. Guests and sponsors are
// contributors: staff grant the role and link the account to one Person record,
// and the account may then propose changes to that profile and nothing else.
export type Role = 'customer' | 'guest' | 'sponsor' | 'staff'
export const contributorRoles = ['guest', 'sponsor'] as const

function usersRecord(user: unknown): Record<string, unknown> | null {
  if (!user || typeof user !== 'object') return null
  const value = user as Record<string, unknown>
  return value.collection === 'users' ? value : null
}

export function isStaff(user: unknown): boolean {
  return usersRecord(user)?.role === 'staff'
}

export function isContributor(user: unknown): boolean {
  const role = usersRecord(user)?.role
  return (contributorRoles as readonly unknown[]).includes(role)
}

// The Person a contributor may edit, or null when none is linked.
export function contributorPerson(user: unknown): number | null {
  if (!isContributor(user)) return null
  const person = usersRecord(user)?.person
  const id = person && typeof person === 'object' ? (person as { id?: unknown }).id : person
  const number = typeof id === 'string' ? Number(id) : id
  return typeof number === 'number' && Number.isSafeInteger(number) && number > 0 ? number : null
}

// The role an OIDC session carries. Staff is never read from the database, so
// removing a subject from OIDC_STAFF_SUBJECTS demotes it on the next request.
export function sessionRole(stored: unknown, isStaffSubject: boolean): Role {
  if (isStaffSubject) return 'staff'
  return (contributorRoles as readonly unknown[]).includes(stored) ? stored as Role : 'customer'
}
