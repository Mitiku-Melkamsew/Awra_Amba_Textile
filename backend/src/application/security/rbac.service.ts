import { UserRole } from "@prisma/client";
import { Capability, ROLE_CAPABILITIES } from "../../domain/security/capabilities.js";

export class RbacService {
  /**
   * Check if a set of roles satisfies the required capability
   */
  static hasCapability(roles: UserRole[] | undefined, capability: Capability): boolean {
    if (!roles || roles.length === 0) return false;
    // Admin has access to all admin capabilities
    return roles.some((role) => {
      const caps = ROLE_CAPABILITIES[role];
      return caps ? caps.includes(capability) : false;
    });
  }

  /**
   * Check if user is an admin
   */
  static isAdmin(roles: UserRole[] | undefined): boolean {
    return Boolean(roles?.includes(UserRole.admin));
  }

  /**
   * Check if user is a weaver
   */
  static isWeaver(roles: UserRole[] | undefined): boolean {
    return Boolean(roles?.includes(UserRole.weaver));
  }

  /**
   * Check if user is a merchant
   */
  static isMerchant(roles: UserRole[] | undefined): boolean {
    return Boolean(roles?.includes(UserRole.merchant));
  }
}
