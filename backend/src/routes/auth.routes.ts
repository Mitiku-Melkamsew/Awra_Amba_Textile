import argon2 from "argon2";
import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../utils/jwt.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const signupSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(30).optional(),
  username: z.string().min(3).max(60),
  password: z.string().min(6),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { username: body.username },
      include: { roles: true },
    });

    if (!user?.passwordHash || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const roles = user.roles.map((r) => r.role);
    const authUser = {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      roles,
      // Backwards-compatibility for existing frontend screens expecting single 'role':
      role: roles[0] ?? UserRole.weaver,
    };

    res.json({
      token: signToken({
        userId: user.userId,
        username: user.username,
        roles,
      }),
      user: authUser,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await argon2.hash(body.password);
    const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username: body.username,
          fullName,
          phone: body.phone,
          passwordHash,
          roles: {
            create: [{ role: UserRole.weaver }],
          },
        },
        include: { roles: true },
      });
      return createdUser;
    });

    const roles = user.roles.map((r) => r.role);
    const authUser = {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      roles,
      role: roles[0] ?? UserRole.weaver,
    };

    res.status(201).json({
      token: signToken({
        userId: user.userId,
        username: user.username,
        roles,
      }),
      user: authUser,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      include: { roles: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }
    const roles = user.roles.map((r) => r.role);
    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        roles,
        role: roles[0] ?? UserRole.weaver,
      },
    });
  } catch (error) {
    next(error);
  }
});
