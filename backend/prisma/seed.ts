import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding redesigned database with clean catalogs and 1 user per role...");

  // 1. Single Admin User
  const adminPasswordHash = await argon2.hash("admin123");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "System Admin",
      passwordHash: adminPasswordHash,
      phone: "0911000000",
      email: "admin@awraamba.local",
    },
    create: {
      username: "admin",
      fullName: "System Admin",
      phone: "0911000000",
      email: "admin@awraamba.local",
      passwordHash: adminPasswordHash,
      roles: {
        create: [{ role: UserRole.admin }],
      },
    },
  });

  // 2. Single Weaver User
  const weaverPasswordHash = await argon2.hash("demo123");
  await prisma.user.upsert({
    where: { username: "demo" },
    update: {
      fullName: "Demo Weaver",
      passwordHash: weaverPasswordHash,
      phone: "0912000000",
      email: "demo.weaver@awraamba.local",
    },
    create: {
      username: "demo",
      fullName: "Demo Weaver",
      phone: "0912000000",
      email: "demo.weaver@awraamba.local",
      passwordHash: weaverPasswordHash,
      roles: {
        create: [{ role: UserRole.weaver }],
      },
    },
  });

  // 3. Single Merchant User
  const merchantPasswordHash = await argon2.hash("merchant123");
  await prisma.user.upsert({
    where: { username: "merchant" },
    update: {
      fullName: "Addis Fabric Merchant",
      passwordHash: merchantPasswordHash,
      phone: "0922000000",
      email: "merchant@addis.local",
    },
    create: {
      username: "merchant",
      fullName: "Addis Fabric Merchant",
      phone: "0922000000",
      email: "merchant@addis.local",
      passwordHash: merchantPasswordHash,
      roles: {
        create: [{ role: UserRole.merchant }],
      },
    },
  });

  console.log("Seeding complete! Catalogs are completely blank.");
  console.log("Created 1 Admin: username='admin', password='admin123'");
  console.log("Created 1 Weaver: username='demo', password='demo123'");
  console.log("Created 1 Merchant: username='merchant', password='merchant123'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
