import { prisma } from "../src/lib/prisma";

const user = await prisma.user.findUnique({ where: { email: 'asadbek.sh220721@gmail.com' }});
console.log('User:', JSON.stringify(user, null, 2));

const org = await prisma.organization.findUnique({ where: { slug: 'bozorchi-demo' }});
console.log('Organization:', JSON.stringify(org, null, 2));

await prisma.$disconnect();