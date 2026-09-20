import { AuthenticatedUser } from './auth.middleware.js';
import { ForbiddenError } from '../common/errors/app-error.js';

export function assertClientScope(user: AuthenticatedUser | undefined, clientId: string): void {
  if (!user) {
    throw new ForbiddenError('Unauthenticated access attempt');
  }

  // Admin and unrestricted CHA have visibility to all clients in their organization
  if (user.role === 'ADMIN' || !user.visibleClientIds || user.visibleClientIds.length === 0) {
    return;
  }

  // If client scope restriction exists, target clientId must be explicitly present
  if (!user.visibleClientIds.includes(clientId)) {
    throw new ForbiddenError(`Client ${clientId} is not within user visible client scope`);
  }
}

export function assertOrganizationScope(user: AuthenticatedUser | undefined, targetOrgId: string): void {
  if (!user) {
    throw new ForbiddenError('Unauthenticated access attempt');
  }

  if (user.organizationId !== targetOrgId) {
    throw new ForbiddenError('Cross-organization access forbidden');
  }
}
