import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Production Admin Account Initialization ===");

  const username = process.env.ADMIN_USERNAME?.trim() || "admin";
  let password = process.env.ADMIN_PASSWORD;
  let fullName = process.env.ADMIN_FULLNAME?.trim() || "System Administrator";
  let phone = process.env.ADMIN_PHONE?.trim() || "0911000000";
  let email = process.env.ADMIN_EMAIL?.trim() || "admin@awraamba.local";

  if (!password) {
    const rl = readline.createInterface({ input, output });
    try {
      password = await rl.question("Enter secure admin password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ");
    } finally {
      rl.close();
    }
  }

  if (!password || password.length < 8) {
    console.error("Error: Admin password must be at least 8 characters long.");
    process.exit(1);
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(password)) {
    console.error("Error: Password must contain at least one uppercase letter, one lowercase letter, and one number.");
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password);

  const existingUser = await prisma.user.findUnique({
    where: { username },
    include: { roles: true },
  });

  if (existingUser) {
    console.log(`User '${username}' already exists. Updating credentials and ensuring admin role...`);
    await prisma.user.update({
      where: { userId: existingUser.userId },
      data: {
        passwordHash,
        fullName,
        phone,
        email,
        isActive: true,
      },
    });

    const hasAdmin = existingUser.roles.some((r) => r.role === UserRole.admin);
    if (!hasAdmin) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: existingUser.userId,
          role: UserRole.admin,
        },
      });
    }
    console.log(`Admin account '${username}' successfully updated.`);
  } else {
    await prisma.user.create({
      data: {
        username,
        fullName,
        phone,
        email,
        passwordHash,
        isActive: true,
        roles: {
          create: [{ role: UserRole.admin }],
        },
      },
    });
    console.log(`Admin account '${username}' successfully created.`);
  }
}

main()
  .catch((e) => {
    console.error("Failed to create admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
