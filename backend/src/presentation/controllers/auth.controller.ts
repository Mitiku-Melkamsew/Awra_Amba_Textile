import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PasswordService } from "../../infrastructure/auth/password.js";
import { signToken } from "../../utils/jwt.js";
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
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

      const roles = user.roles.map((r) => r.role);
      const token = signToken({
        userId: user.userId,
        username: user.username,
        roles,
      });

      res.json({
        token,
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          roles,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;
      const username = String(body.username ?? "").trim();
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new ConflictError("Username is already taken");
      }

      const passwordHash = await PasswordService.hash(body.password);
      const chosenRole = body.role === "merchant" ? UserRole.merchant : UserRole.weaver;
      // Schema uses fullName only (no firstName/lastName columns).
      const fullName = String(body.fullName ?? "").trim();
      if (!fullName) {
        throw new ValidationError("fullName is required");
      }

      const user = await prisma.user.create({
        data: {
          username,
          fullName,
          phone: body.phone ? String(body.phone).trim() || null : null,
          passwordHash,
          roles: {
            create: [{ role: chosenRole }],
          },
        },
        include: { roles: true },
      });

      const roles = user.roles.map((r) => r.role);
      const token = signToken({
        userId: user.userId,
        username: user.username,
        roles,
      });

      res.status(201).json({
        token,
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          roles,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");

      const user = await prisma.user.findUnique({
        where: { userId: req.user.userId },
        include: { roles: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError("User not found or account is deactivated");
      }

      res.json({
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          roles: user.roles.map((r) => r.role),
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");

      const user = await prisma.user.findUnique({ where: { userId: req.user.userId } });
      if (!user?.passwordHash) throw new UnauthorizedError("User not found");

      const valid = await PasswordService.verify(user.passwordHash, req.body.currentPassword);
      if (!valid) throw new UnauthorizedError("Current password is incorrect");

      const newHash = await PasswordService.hash(req.body.newPassword);
      await prisma.user.update({
        where: { userId: user.userId },
        data: { passwordHash: newHash },
      });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");

      const currentUser = await prisma.user.findUnique({
        where: { userId: req.user.userId },
        include: { roles: true },
      });
      if (!currentUser || !currentUser.isActive) {
        throw new UnauthorizedError("User not found or account is deactivated");
      }

      const fullName = String(req.body.fullName ?? "").trim();
      const username = String(req.body.username ?? "").trim();
      const phone = req.body.phone ? String(req.body.phone).trim() || null : null;

      if (!fullName) {
        throw new ValidationError("Full name is required");
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
        data: { fullName, username, phone },
        include: { roles: true },
      });

      const roles = updated.roles.map((r) => r.role);
      const token = signToken({
        userId: updated.userId,
        username: updated.username,
        roles,
      });

      res.json({
        token,
        user: {
          userId: updated.userId,
          username: updated.username,
          fullName: updated.fullName,
          phone: updated.phone,
          email: updated.email,
          roles,
          isActive: updated.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
