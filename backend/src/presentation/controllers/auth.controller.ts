import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../../application/services/auth.service.js";
import { UnauthorizedError } from "../../domain/errors/domain-errors.js";
import { serializeAuthUser } from "../serializers/auth.serializer.js";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const { token, user } = await AuthService.login(username, password);
      res.json({
        token,
        user: serializeAuthUser(user),
      });
    } catch (error) {
      next(error);
    }
  }

  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, user } = await AuthService.signup(req.body);
      res.status(201).json({
        token,
        user: serializeAuthUser(user),
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const user = await AuthService.getMe(req.user.userId);
      res.json({
        user: serializeAuthUser(user),
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { token } = await AuthService.changePassword(
        req.user.userId,
        req.body.currentPassword,
        req.body.newPassword,
      );
      res.json({ success: true, message: "Password updated successfully", token });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { token, user } = await AuthService.updateProfile(req.user.userId, req.body);
      res.json({
        token,
        user: serializeAuthUser(user),
      });
    } catch (error) {
      next(error);
    }
  }
}
