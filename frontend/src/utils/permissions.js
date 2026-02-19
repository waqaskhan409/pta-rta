/**
 * Centralized Permission Configuration System
 * Uses backend-provided role and features data
 * No hardcoding of roles - everything is based on backend permissions
 */

/**
 * Check if user has a specific feature
 * @param {Object} user - User object from backend
 * @param {string} featureName - Feature name to check (e.g., 'permit_edit', 'permit_view')
 * @returns {boolean}
 */
export const hasFeature = (user, featureName) => {
  if (!user) return false;
  if (user.is_staff) return true; // Admins have all features

  if (!user.features || !Array.isArray(user.features)) {
    return false;
  }

  return user.features.some(feature => feature.name === featureName);
};

/**
 * Get all visible columns for user based on their features
 * If user has 'employee' feature, show all columns
 * Otherwise, show only public columns
 * @param {Object} user - User object from backend
 * @returns {Set<string>} Set of visible column names
 */
export const getVisibleColumns = (user) => {
  const publicColumns = new Set([
    'permitNumber',
    'vehicle',
    'owner',
    'authority',
    'type',
    'status',
    'renewalStatus',
    'actions',
  ]);

  const employeeColumns = new Set([
    ...publicColumns,
    'assignedTo',
    'lastAction',
    'changes',
    'modified',
  ]);

  // Check if user is an employee (has 'employee' feature) or is staff admin
  const isEmployee = hasFeature(user, 'employee') || user?.is_staff;

  return isEmployee ? employeeColumns : publicColumns;
};

/**
 * Check if a column should be visible
 * @param {Object} user - User object from backend
 * @param {string} columnName - Column name to check
 * @returns {boolean}
 */
export const isColumnVisible = (user, columnName) => {
  return getVisibleColumns(user).has(columnName);
};

/**
 * Get the number of visible columns (for colspan calculation)
 * @param {Object} user - User object from backend
 * @returns {number}
 */
export const getVisibleColumnCount = (user) => {
  return getVisibleColumns(user).size;
};

/**
 * Check if user can edit permits
 * @param {Object} user - User object from backend
 * @returns {boolean}
 */
export const canEditPermits = (user) => {
  if (!user) return false;
  if (user.is_staff) return true;
  return hasFeature(user, 'permit_edit');
};

/**
 * Check if user can view reports
 * @param {Object} user - User object from backend
 * @returns {boolean}
 */
export const canViewReports = (user) => {
  if (!user) return false;
  if (user.is_staff) return true;
  return hasFeature(user, 'reports_view');
};

/**
 * Check if user can manage users
 * @param {Object} user - User object from backend
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  if (user.is_staff) return true;
  return hasFeature(user, 'user_management');
};

/**
 * Check if user can assign permits
 * @param {Object} user - User object from backend
 * @returns {boolean}
 */
export const canAssignPermits = (user) => {
  if (!user) return false;
  if (user.is_staff) return true;
  return hasFeature(user, 'permit_assign');
};

/**
 * Get user's role name
 * @param {Object} user - User object from backend
 * @returns {string|null}
 */
export const getUserRole = (user) => {
  if (!user) return null;
  if (!user.role) return null;
  return typeof user.role === 'object' ? user.role.name : user.role;
};

/**
 * Check if user can edit a specific permit
 * @param {Object} user - User object from backend
 * @param {Object} permit - Permit object
 * @returns {boolean}
 */
export const canEditThisPermit = (user, permit) => {
  if (!user) return false;
  if (!canEditPermits(user)) return false;

  // Admins can edit any permit
  if (user.is_staff) return true;

  // Check if permit is assigned and user role matches assign role
  if (!permit.assigned_to) return false;

  const userRole = (user?.role?.name || user?.role || '').toLowerCase().trim();
  const assignedRole = (permit.assigned_to_role || '').toLowerCase().trim();

  return userRole === assignedRole && userRole && assignedRole;
};
