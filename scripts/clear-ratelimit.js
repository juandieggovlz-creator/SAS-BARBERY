const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.rateLimitStore.findMany();
  console.log('RateLimit records in DB:', records);
  await prisma.rateLimitStore.deleteMany({});
  console.log('RateLimitStore cleared.');
}

main().finally(() => prisma.$disconnect());

