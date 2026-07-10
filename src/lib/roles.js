/** Roles that have full management access */
export const ADMIN_ROLES = ['president', 'vice_president', 'secretary']

/** Returns true if the given role has admin-level access */
export function isAdmin(role) {
  return ADMIN_ROLES.includes(role?.toLowerCase())
}

/** Human-readable label for a role */
export function formatRole(role) {
  switch (role?.toLowerCase()) {
    case 'president':
    case 'vice_president':
    case 'secretary':
      return 'Admin'
    case 'member':
      return 'Member'
    default:
      return role
        ? role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')
        : 'Member'
  }
}
