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
    const user = await prisma.user.findUnique({ where: { username: body.username } });

    if (!user?.passwordHash || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const authUser = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      weaverId: user.weaverId,
      merchantId: user.merchantId,
    };

    res.json({
      token: signToken(authUser),
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
    const result = await prisma.$transaction(async (tx) => {
      const weaver = await tx.weaver.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
        },
      });
      const user = await tx.user.create({
        data: {
          username: body.username,
          passwordHash,
          role: UserRole.weaver,
          weaverId: weaver.weaverId,
        },
      });
      return { user, weaver };
    });

    const authUser = {
      userId: result.user.userId,
      username: result.user.username,
      role: result.user.role,
      weaverId: result.user.weaverId,
      merchantId: result.user.merchantId,
    };

    res.status(201).json({
      token: signToken(authUser),
      user: authUser,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});