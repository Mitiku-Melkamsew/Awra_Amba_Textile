import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../application/services/user.service.js";

export class UserController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, isActive, query, limit, offset } = req.query as any;
      const result = await UserService.listUsers({
        role,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        query,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await UserService.getUserById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await UserService.createUser(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await UserService.updateUser(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await UserService.setUserStatus(id, req.body.isActive, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const result = await UserService.assignRole(id, req.body.role, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async revokeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const role = req.params.role as any;
      const actorUserId = req.user!.userId;
      const result = await UserService.revokeRole(id, role, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const result = await UserService.resetPassword(id, req.body.newPassword, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const balance = await UserService.getUserBalance(id);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }
}
