import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { sendSuccess, sendError, handleErrorResponse } from '../common/http';
import { ValidationError, NotFoundError, ConflictError } from '../common/errors';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';

const router = Router();
const resend = new Resend(env.RESEND_API_KEY);

// Sign up endpoint with email verification
router.post('/api/auth/sign-up/email', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      orgName: z.string().min(1),
    });

    const data = schema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // In transaction: create organization and user
    const result = await prisma.$transaction(async (tx: any) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.orgName,
        },
      });

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          organizationId: organization.id,
          role: 'OWNER',
          emailVerified: false,
        },
      });

      // Create email verification record
      await tx.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt: verificationExpires,
        },
      });

      return { user, organization };
    });

    // Send verification email via Resend
    const confirmationLink = `${env.FRONTEND_URL || 'http://localhost:3005'}/confirm/${verificationToken}`;

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: 'Verify your DemurrageOS email',
        html: `
          <h2>Verify your email</h2>
          <p>Welcome to DemurrageOS, ${data.name}!</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${confirmationLink}">Verify Email</a></p>
          <p>Or copy and paste this link in your browser:</p>
          <p>${confirmationLink}</p>
          <p>This link expires in 24 hours.</p>
        `,
      });

      logger.info({ userId: result.user.id, email: data.email }, 'Verification email sent');
    } catch (emailError) {
      logger.error({ error: emailError, email: data.email }, 'Failed to send verification email');
      // Continue with sign-up even if email fails - user can request resend later
      // Don't expose the error to the client
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        orgId: result.organization.id,
        role: result.user.role,
      },
      process.env.BETTER_AUTH_SECRET!,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('better-auth.session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        orgId: result.organization.id,
        orgName: result.organization.name,
        emailVerified: false,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', undefined, fields);
      return;
    }
    if (error instanceof ConflictError) {
      sendError(res, 409, error.name, error.message);
      return;
    }
    handleErrorResponse(error, res);
  }
});

// Sign in endpoint
router.post('/api/auth/sign-in/email', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = schema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        emailVerifications: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new NotFoundError('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new ConflictError('Please verify your email first');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        orgId: user.organizationId,
        role: user.role,
      },
      process.env.BETTER_AUTH_SECRET!,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('better-auth.session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.organizationId,
        orgName: user.organization.name,
        emailVerified: user.emailVerified,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) fields[path] = [];
        fields[path].push(err.message);
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', undefined, fields);
      return;
    }
    if (error instanceof NotFoundError) {
      sendError(res, 401, error.name, error.message);
      return;
    }
    if (error instanceof ConflictError) {
      sendError(res, 409, error.name, error.message);
      return;
    }
    handleErrorResponse(error, res);
  }
});

// Sign out endpoint
router.post('/api/auth/sign-out', requireAuth, (req: Request, res: Response) => {
  // Clear the cookie
  res.clearCookie('better-auth.session_token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  sendSuccess(res, { success: true });
});

// Get session endpoint
router.get('/api/auth/get-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: true,
      },
    });

    if (!user) {
      sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
      return;
    }

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.organizationId,
        orgName: user.organization.name,
        emailVerified: user.emailVerified,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    handleErrorResponse(error, res);
  }
});

// Email confirmation endpoint - GET (public)
router.get('/api/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      sendError(res, 404, 'INVALID_TOKEN', 'Verification token not found or already used', undefined);
      return;
    }

    // Check expiry
    if (new Date() > verification.expiresAt) {
      sendError(res, 410, 'EXPIRED_TOKEN', 'Verification token has expired', undefined);
      return;
    }

    // Mark user as verified and delete verification record
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.delete({
        where: { token },
      }),
    ]);

    logger.info({ userId: verification.userId, email: verification.user.email }, 'Email verified');

    sendSuccess(res, {
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch (error: unknown) {
    logger.error({ error, token: req.params.token }, 'Email confirmation error');
    handleErrorResponse(error, res);
  }
});

// Email confirmation endpoint - POST (public)
router.post('/api/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      sendError(res, 404, 'INVALID_TOKEN', 'Verification token not found or already used', undefined);
      return;
    }

    // Check expiry
    if (new Date() > verification.expiresAt) {
      sendError(res, 410, 'EXPIRED_TOKEN', 'Verification token has expired', undefined);
      return;
    }

    // Mark user as verified and delete verification record
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.delete({
        where: { token },
      }),
    ]);

    logger.info({ userId: verification.userId, email: verification.user.email }, 'Email verified');

    sendSuccess(res, {
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch (error: unknown) {
    logger.error({ error, token: req.params.token }, 'Email confirmation error');
    handleErrorResponse(error, res);
  }
});

export default router;