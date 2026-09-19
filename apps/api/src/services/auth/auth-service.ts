import { Response } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export interface AuthRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: any;
  token: string;
}

export class AuthService {
  async login(email: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      logger.warn({ email }, 'Login failed: user not found');
      throw new Error('User not found');
    }

    // Generate simple token for demo (in production, use JWT)
    const token = `${user.id}|${user.organizationId}`;

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    };
  }

  async getCurrentUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    // Map roles to permissions
    const rolePermissions: Record<string, string[]> = {
      OWNER: ['*'],
      ADMIN: ['read:*', 'write:*'],
      OPERATIONS: ['read:containers', 'read:tasks', 'write:tasks', 'read:alerts'],
      CHA_USER: ['read:containers', 'read:documents'],
      FINANCE: ['read:charges', 'read:analytics', 'write:charges'],
      VIEWER: ['read:containers', 'read:analytics'],
    };

    return rolePermissions[user.role] || [];
  }
}
