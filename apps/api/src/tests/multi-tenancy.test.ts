import { describe, it, expect } from 'vitest';
import { assertClientScope, assertOrganizationScope } from '../middleware/scope.middleware.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';
import { ForbiddenError } from '../common/errors/app-error.js';

describe('Multi-Tenant & Client Scoping Security - Unit Tests', () => {
  const userOrgA: AuthenticatedUser = {
    id: 'user-1',
    organizationId: 'org-A',
    email: 'user@orga.com',
    role: 'CHA',
    visibleClientIds: ['client-1', 'client-2'] // Restricted scope
  };

  const adminOrgA: AuthenticatedUser = {
    id: 'admin-1',
    organizationId: 'org-A',
    email: 'admin@orga.com',
    role: 'ADMIN',
    visibleClientIds: undefined // Full organization access
  };

  describe('Organization Scope Boundary', () => {
    it('should allow access when organization IDs match', () => {
      expect(() => assertOrganizationScope(userOrgA, 'org-A')).not.toThrow();
    });

    it('should forbid access when accessing a different organization (Cross-Tenant Attack)', () => {
      expect(() => assertOrganizationScope(userOrgA, 'org-B')).toThrow(ForbiddenError);
    });

    it('should forbid access if user is undefined', () => {
      expect(() => assertOrganizationScope(undefined, 'org-A')).toThrow(ForbiddenError);
    });
  });

  describe('Client Scope Boundary', () => {
    it('should allow access to clients within the user visibleClientIds scope', () => {
      expect(() => assertClientScope(userOrgA, 'client-1')).not.toThrow();
      expect(() => assertClientScope(userOrgA, 'client-2')).not.toThrow();
    });

    it('should forbid access to clients outside user visibleClientIds scope', () => {
      expect(() => assertClientScope(userOrgA, 'client-3')).toThrow(ForbiddenError);
    });

    it('should permit ADMIN users to access any client in their organization', () => {
      expect(() => assertClientScope(adminOrgA, 'client-99')).not.toThrow();
    });
  });
});
