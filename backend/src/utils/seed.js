require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPass = await bcrypt.hash('admin123', 12);
  const memberPass = await bcrypt.hash('member123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: { name: 'Alex Admin', email: 'admin@taskflow.com', password: adminPass, role: 'ADMIN' }
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'sara@taskflow.com' },
    update: {},
    create: { name: 'Sara Chen', email: 'sara@taskflow.com', password: memberPass, role: 'MEMBER' }
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'jake@taskflow.com' },
    update: {},
    create: { name: 'Jake Rivera', email: 'jake@taskflow.com', password: memberPass, role: 'MEMBER' }
  });

  // Create project
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'TaskFlow MVP',
      description: 'Building the core features of the task management platform',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'MEMBER' },
          { userId: member2.id, role: 'MEMBER' }
        ]
      }
    }
  });

  // Create tasks
  const tasks = [
    { title: 'Setup project repository', status: 'DONE', priority: 'HIGH', assigneeId: member1.id },
    { title: 'Design database schema', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Build REST API endpoints', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: member1.id },
    { title: 'Create frontend components', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: member2.id },
    { title: 'Write unit tests', status: 'TODO', priority: 'MEDIUM', assigneeId: member1.id },
    { title: 'Deploy to production', status: 'TODO', priority: 'HIGH', dueDate: new Date(Date.now() - 86400000) }
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, projectId: project.id, creatorId: admin.id }
    });
  }

  console.log('✅ Seed complete!');
  console.log('📧 Admin: admin@taskflow.com / admin123');
  console.log('📧 Member: sara@taskflow.com / member123');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
