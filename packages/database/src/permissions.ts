import { hasPermission as hasPermissionDb } from './queries';

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  try {
    return await hasPermissionDb(userId, permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has permission and throw error if not
 */
export async function requirePermission(
  userId: string,
  permissionName: string
): Promise<void> {
  const hasPerm = await checkPermission(userId, permissionName);
  if (!hasPerm) {
    throw new PermissionError(
      `User does not have required permission: ${permissionName}`
    );
  }
}

/**
 * Check multiple permissions (user needs at least one)
 */
export async function checkAnyPermission(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissionNames.map(perm => hasPermissionDb(userId, perm))
    );
    return results.some(result => result);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check multiple permissions (user needs all of them)
 */
export async function checkAllPermissions(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissionNames.map(perm => hasPermissionDb(userId, perm))
    );
    return results.every(result => result);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}
