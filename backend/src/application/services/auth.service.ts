import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PasswordService } from "../../infrastructure/auth/password.js";
import { signToken, verifyToken } from "../../utils/jwt.js";
import type { AuthUser } from "../../types/express.js";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";

function issueTokenForUser(user: {
  userId: number;
  username: string;
  tokenVersion: number;
  roles: Array<{ role: UserRole }>;
}): string {
  return signToken({
    userId: user.userId,
    username: user.username,
    roles: user.roles.map((r) => r.role),
    tokenVersion: user.tokenVersion,
  });
}

export class AuthService {
  static async authenticateToken(token: string): Promise<AuthUser> {
    let payload: AuthUser;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired authentication token");
    }

    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      select: {
        userId: true,
        username: true,
        isActive: true,
        tokenVersion: true,
        roles: { select: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User account is inactive or no longer exists");
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedError("Session has been invalidated. Please sign in again.");
    }

    return {
      userId: user.userId,
      username: user.username,
      roles: user.roles.map((r) => r.role),
      tokenVersion: user.tokenVersion,
    };
  }

  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: true },
    });

    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const valid = await PasswordService.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const token = issueTokenForUser(user);
    return { token, user };
  }

  static async signup(input: {
    username: string;
    password: string;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    role?: string;
  }) {
    const username = String(input.username ?? "").trim();
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new ConflictError("Username is already taken");
    }

    const passwordHash = await PasswordService.hash(input.password);
    const chosenRole = input.role === "merchant" ? UserRole.merchant : UserRole.weaver;
    const firstName = String(input.firstName ?? "").trim();
    const lastName = input.lastName ? String(input.lastName).trim() || null : null;
    if (!firstName) {
      throw new ValidationError("firstName is required");
    }

    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        phone: input.phone ? String(input.phone).trim() || null : null,
        passwordHash,
        roles: {
          create: [{ role: chosenRole }],
        },
      },
      include: { roles: true },
    });

    const token = issueTokenForUser(user);
    return { token, user };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or account is deactivated");
    }

    return user;
  }

  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ token: string }> {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user?.passwordHash) {
      throw new UnauthorizedError("User not found");
    }

    const valid = await PasswordService.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newHash = await PasswordService.hash(newPassword);
    const updated = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
      include: { roles: true },
    });

    const token = issueTokenForUser(updated);
    return { token };
  }

  static async updateProfile(
    userId: number,
    input: {
      firstName: string;
      lastName?: string | null;
      username: string;
      phone?: string | null;
    },
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { userId },
      include: { roles: true },
    });
    if (!currentUser || !currentUser.isActive) {
      throw new UnauthorizedError("User not found or account is deactivated");
    }

    const firstName = String(input.firstName ?? "").trim();
    const lastName = input.lastName ? String(input.lastName).trim() || null : null;
    const username = String(input.username ?? "").trim();
    const phone = input.phone ? String(input.phone).trim() || null : null;

    if (!firstName) {
      throw new ValidationError("First name is required");
    }
    if (username.length < 3) {
      throw new ValidationError("Username must be at least 3 characters");
    }

    if (username !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.userId !== currentUser.userId) {
        throw new ConflictError("Username is already taken");
      }
    }

    const updated = await prisma.user.update({
      where: { userId: currentUser.userId },
      data: { firstName, lastName, username, phone },
      include: { roles: true },
    });

    const token = issueTokenForUser(updated);
    return { token, user: updated };
  }
}
