import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: Database seeding is disabled in production.");
    console.error("Create the initial admin user via a secure CLI command or migration script.");
    process.exit(1);
  }

  console.log("Seeding development database...");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeOnFirstLogin!1";
  const adminPasswordHash = await argon2.hash(adminPassword);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "System Admin",
      passwordHash: adminPasswordHash,
      phone: "0911000000",
    },
    create: {
      username: "admin",
      fullName: "System Admin",
      phone: "0911000000",
      passwordHash: adminPasswordHash,
      roles: {
        create: [{ role: UserRole.admin }],
      },
    },
  });

  console.log("Seeding complete!");
  console.log("Admin user created: username='admin'");
  console.log("Password was read from SEED_ADMIN_PASSWORD env var (or default for dev).");
  console.log("IMPORTANT: Change the admin password immediately after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
