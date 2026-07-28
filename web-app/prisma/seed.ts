import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";

type SeedBranch = {
  name: string;
  address?: string;
};

type SeedUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branchName?: string;
};

const prisma = new PrismaClient();

function parseJsonArray<T>(variableName: string): T[] {
  const rawValue = process.env[variableName];
  if (!rawValue) {
    return [];
  }

  const parsed: unknown = JSON.parse(rawValue);
  if (!Array.isArray(parsed)) {
    throw new Error(`${variableName} must be a JSON array.`);
  }

  return parsed as T[];
}

async function main() {
  const branches = parseJsonArray<SeedBranch>("SEED_BRANCHES_JSON");
  const users = parseJsonArray<SeedUser>("SEED_USERS_JSON");
  const branchIds = new Map<string, string>();

  for (const branch of branches) {
    if (!branch.name?.trim()) {
      throw new Error("Every seed branch requires a non-empty name.");
    }

    const savedBranch = await prisma.branch.upsert({
      where: { name: branch.name.trim() },
      update: {
        address: branch.address?.trim() || null,
        active: true,
      },
      create: {
        name: branch.name.trim(),
        address: branch.address?.trim() || null,
      },
    });
    branchIds.set(savedBranch.name, savedBranch.id);
  }

  for (const user of users) {
    const branchId = user.branchName ? branchIds.get(user.branchName) : undefined;

    if (user.role === UserRole.super_admin && user.branchName) {
      throw new Error(`Super admin ${user.email} cannot have a branch.`);
    }
    if (user.role !== UserRole.super_admin && !branchId) {
      throw new Error(
        `User ${user.email} requires branchName matching SEED_BRANCHES_JSON.`,
      );
    }

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        branchId: branchId ?? null,
        active: true,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        branchId: branchId ?? null,
      },
    });
  }

  console.log(`Seeded ${branches.length} branches and ${users.length} users.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
