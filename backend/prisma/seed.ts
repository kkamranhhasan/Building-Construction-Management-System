import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Upsert Owner
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {
      idNumber: '99000001',
      phone: '+880 1711-000001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isApproved: true,
    },
    create: {
      username: 'owner',
      password: passwordHash,
      name: 'System Owner',
      idNumber: '99000001',
      phone: '+880 1711-000001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      role: 'OWNER',
      isApproved: true,
    },
  });

  // Upsert Manager
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {
      idNumber: '33000001',
      phone: '+880 1711-000002',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      isApproved: true,
    },
    create: {
      username: 'manager',
      password: passwordHash,
      name: 'System Manager',
      idNumber: '33000001',
      phone: '+880 1711-000002',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      role: 'MANAGER',
      isApproved: true,
    },
  });

  // Upsert Site Manager
  const sitemanager = await prisma.user.upsert({
    where: { username: 'sitemanager' },
    update: {
      idNumber: '22000001',
      phone: '+880 1711-000003',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      trade: 'Site Manager & Engineer',
      isApproved: true,
    },
    create: {
      username: 'sitemanager',
      password: passwordHash,
      name: 'Tariqul Islam',
      idNumber: '22000001',
      phone: '+880 1711-000003',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      trade: 'Site Manager & Engineer',
      role: 'SITE_MANAGER',
      isApproved: true,
    },
  });

  // Upsert Worker 1
  const worker1 = await prisma.user.upsert({
    where: { username: 'worker1' },
    update: {
      idNumber: '11000001',
      phone: '+880 1711-100001',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      trade: 'Mason (রাজমিস্ত্রি)',
      hourlyRate: 18.50,
      isApproved: true,
    },
    create: {
      username: 'worker1',
      password: passwordHash,
      name: 'Md. Rahim Ullah',
      idNumber: '11000001',
      phone: '+880 1711-100001',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      trade: 'Mason (রাজমিস্ত্রি)',
      role: 'WORKER',
      hourlyRate: 18.50,
      isApproved: true,
    },
  });

  // Upsert Worker 2
  const worker2 = await prisma.user.upsert({
    where: { username: 'worker2' },
    update: {
      idNumber: '11000002',
      phone: '+880 1711-100002',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      trade: 'Electrician (ইলেকট্রিশিয়ান)',
      hourlyRate: 16.00,
      isApproved: true,
    },
    create: {
      username: 'worker2',
      password: passwordHash,
      name: 'Hasan Ali',
      idNumber: '11000002',
      phone: '+880 1711-100002',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      trade: 'Electrician (ইলেকট্রিশিয়ান)',
      role: 'WORKER',
      hourlyRate: 16.00,
      isApproved: true,
    },
  });

  // Ensure default site exists with assigned manager & workers
  let site = await prisma.site.findFirst({
    where: { name: 'Gulshan Tower Project' },
  });

  if (!site) {
    site = await prisma.site.create({
      data: {
        name: 'Gulshan Tower Project',
        location: 'Gulshan-2, Dhaka',
        description: '28-Story Commercial & Residential High-Rise Building with underground parking.',
        latitude: 23.7925,
        longitude: 90.4078,
        radiusMeters: 500,
        managers: { connect: [{ id: sitemanager.id }] },
        workers: { connect: [{ id: worker1.id }, { id: worker2.id }] },
      },
    });
  } else {
    // Ensure manager and workers are connected
    await prisma.site.update({
      where: { id: site.id },
      data: {
        managers: { connect: [{ id: sitemanager.id }] },
        workers: { connect: [{ id: worker1.id }, { id: worker2.id }] },
      },
    });
  }

  console.log('Seed completed successfully with all user roles!');
  console.log({ owner, manager, sitemanager, worker1, worker2, site: site.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
