import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });
    console.log('Admin user:', admin ? '✅ Found' : '❌ Not found');
    if (admin) {
      console.log('Admin email:', admin.email);
      console.log('Admin name:', admin.name);
      console.log('Admin status:', admin.status);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

checkAdmin();
