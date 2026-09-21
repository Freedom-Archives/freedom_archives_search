import { Forbidden } from '@feathersjs/errors';

const ROLE_HIERARCHY = ['intern', 'staff', 'administrator'];

const SERVICE_PERMISSIONS = {
  users: "administrator",
  settings: "staff",
  snapshots: "administrator",
  duplicate_records: "staff",
  duplicate_list_items: "staff",
  data_cleanup: "staff",
  // Other services default to 'intern' (all roles can write)
};

const INTERN_REVIEW_SERVICES = ['records', 'collections'];
const WRITE_METHODS = ['create', 'update', 'patch', 'remove'];

const authRoles = async (context) => {
  const { method, service, data, id, params } = context;
  if (!WRITE_METHODS.includes(method)) {
    return context;
  }
  const { user } = params;
  // if (!user) {
  //   return context;
  // }
  const serviceName = (service.options?.name || context.path).replace('api/', '');
  const userRole = user?.role;

  const userRoleValue = ROLE_HIERARCHY.indexOf(userRole);
  const serviceRoleValue = ROLE_HIERARCHY.indexOf(SERVICE_PERMISSIONS[serviceName]);

  let isPasswordChange = false;
  // console.log('USER', userRole, userRoleValue);
  // console.log('SERVICE', serviceName, SERVICE_PERMISSIONS[serviceName], serviceRoleValue);
  // Only apply to write operations


  // Skip if no user (should be handled by authentication)

  // Check if service requires permissions

  // Prevent users from modifying their own user entry
  if (serviceName === 'users') {
    const targetUserId = id || data?.user_id;

    if (targetUserId && targetUserId.toString() === user.user_id.toString()) {
      isPasswordChange = true;
      delete data.user_id;
      delete data.role;
      delete data.active;
    }
  }

  if (serviceRoleValue && userRoleValue < serviceRoleValue && !isPasswordChange) {
    throw new Forbidden(`Role '${userRole}' does not have write access to '${serviceName}'`);
  }


  // Set needs_review = true for intern writes to records/collections
  if (
    userRole === 'intern' &&
    INTERN_REVIEW_SERVICES.includes(serviceName) &&
    method !== 'remove'
  ) {
    context.data.needs_review = true;
  }

  return context;
};

export default authRoles;