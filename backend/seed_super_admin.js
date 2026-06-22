const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const username = 'giancio';
  const password = 'giancio123'; // Password custom dari user
  
  try {
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing) {
      console.log(`Akun '${username}' sudah ada.`);
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        shift: null
      }
    });
    
    console.log(`Berhasil membuat akun Super Admin!`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${newUser.role}`);
  } catch (error) {
    console.error('Gagal membuat akun Super Admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
