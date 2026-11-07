import argon2 from "argon2";

export class PasswordService {
  static async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  static async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
