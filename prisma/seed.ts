import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("SEED_ADMIN_EMAIL 環境変数を設定してください");
    process.exit(1);
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", isActive: true },
    create: {
      email: adminEmail,
      name: "管理者",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`管理者アカウントを作成しました: ${admin.email}`);
  console.log("このメールアドレスで Google ログインすると管理者として入場できます");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
