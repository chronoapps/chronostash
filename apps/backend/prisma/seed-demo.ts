import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

// Helper to generate dates going back N days
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper to add random minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Random number between min and max
function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random item from array
function randomItem<T>(array: T[]): T {
  return array[random(0, array.length - 1)];
}

async function main() {
  console.log('🌱 Seeding demo data...\n');

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@chronostash.com',
      password: demoPassword,
      role: 'admin',
    },
  });
  console.log('✓ Created demo user (username: demo, password: demo123)');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@chronostash.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('✓ Created admin user (username: admin, password: admin123456)');

  // Create database connections
  const databases = await Promise.all([
    prisma.database.create({
      data: {
        name: 'Production PostgreSQL',
        engine: 'POSTGRESQL',
        host: 'prod-db.example.com',
        port: 5432,
        username: 'postgres',
        password: 'encrypted_password_here',
        database: 'production',
        sslMode: 'REQUIRE',
      },
    }),
    prisma.database.create({
      data: {
        name: 'Staging PostgreSQL',
        engine: 'POSTGRESQL',
        host: 'staging-db.example.com',
        port: 5432,
        username: 'postgres',
        password: 'encrypted_password_here',
        database: 'staging',
        sslMode: 'REQUIRE',
      },
    }),
    prisma.database.create({
      data: {
        name: 'Production MySQL',
        engine: 'MYSQL',
        host: 'mysql.example.com',
        port: 3306,
        username: 'root',
        password: 'encrypted_password_here',
        database: 'app_production',
        sslMode: 'PREFER',
      },
    }),
    prisma.database.create({
      data: {
        name: 'MongoDB Cluster',
        engine: 'MONGODB',
        host: 'mongodb.example.com',
        port: 27017,
        username: 'mongouser',
        password: 'encrypted_password_here',
        database: 'analytics',
        sslMode: 'DISABLE',
      },
    }),
    prisma.database.create({
      data: {
        name: 'Development PostgreSQL',
        engine: 'POSTGRESQL',
        host: 'localhost',
        port: 5432,
        username: 'dev',
        password: 'devpass',
        database: 'dev_db',
        sslMode: 'DISABLE',
      },
    }),
  ]);
  console.log(`✓ Created ${databases.length} database connections`);

  // Create storage targets
  const storageTargets = await Promise.all([
    prisma.storageTarget.create({
      data: {
        name: 'AWS S3 Production',
        type: 'S3',
        config: JSON.stringify({
          bucket: 'chronostash-prod-backups',
          region: 'us-east-1',
          accessKeyId: 'AKIAEXAMPLEKEY',
          secretAccessKey: 'encrypted_secret_key',
        }),
        encryptionKey: 'aes256-encryption-key',
      },
    }),
    prisma.storageTarget.create({
      data: {
        name: 'Cloudflare R2',
        type: 'CLOUDFLARE_R2',
        config: JSON.stringify({
          bucket: 'chronostash-backups',
          accountId: 'cf-account-id',
          accessKeyId: 'r2-access-key',
          secretAccessKey: 'encrypted_r2_secret',
          endpoint: 'https://account-id.r2.cloudflarestorage.com',
        }),
        encryptionKey: 'aes256-encryption-key',
      },
    }),
    prisma.storageTarget.create({
      data: {
        name: 'Google Drive Backup',
        type: 'GOOGLE_DRIVE',
        config: JSON.stringify({
          folderId: 'google-drive-folder-id',
          credentials: 'encrypted_oauth_credentials',
        }),
      },
    }),
  ]);
  console.log(`✓ Created ${storageTargets.length} storage targets`);

  // Create backup history for the past 30+ days
  const backupStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'FAILED', 'CANCELLED'];
  const backups = [];

  console.log('✓ Generating 30+ days of backup history...');

  // Generate backups for the past 35 days
  for (let day = 35; day >= 0; day--) {
    const date = daysAgo(day);

    // Each day has 2-4 backups at different times
    const backupsPerDay = random(2, 4);

    for (let i = 0; i < backupsPerDay; i++) {
      const db = randomItem(databases);
      const storage = randomItem(storageTargets);
      const status = randomItem(backupStatuses);

      const startedAt = new Date(date);
      startedAt.setHours(random(0, 23), random(0, 59), random(0, 59));

      const duration = status === 'COMPLETED' ? random(30, 300) : random(10, 120);
      const completedAt = status === 'COMPLETED' || status === 'FAILED'
        ? addMinutes(startedAt, Math.floor(duration / 60))
        : null;

      const size = status === 'COMPLETED'
        ? BigInt(random(100000000, 5000000000)) // 100MB to 5GB
        : null;

      const progress = status === 'COMPLETED' ? 100
        : status === 'FAILED' ? random(10, 90)
          : status === 'CANCELLED' ? random(5, 50)
            : 0;

      const backup = await prisma.backup.create({
        data: {
          databaseId: db.id,
          storageId: storage.id,
          status,
          progress,
          startedAt,
          completedAt,
          duration: completedAt ? duration : null,
          size,
          storagePath: status === 'COMPLETED'
            ? `backups/${db.name.toLowerCase().replace(/\s+/g, '-')}/${startedAt.toISOString()}.dump`
            : null,
          manifest: status === 'COMPLETED'
            ? JSON.stringify({
              version: '1.0',
              database: db.name,
              engine: db.engine,
              timestamp: startedAt.toISOString(),
              size: size?.toString(),
              compressed: true,
              encrypted: true,
            })
            : null,
          error: status === 'FAILED'
            ? randomItem([
              'Connection timeout after 30 seconds',
              'Insufficient permissions to read database',
              'Storage quota exceeded',
              'Network error: Connection refused',
              'Database locked by another process',
            ])
            : status === 'CANCELLED'
              ? 'Backup cancelled by user'
              : null,
          createdAt: startedAt,
        },
      });

      backups.push(backup);
    }
  }
  console.log(`✓ Created ${backups.length} backup records`);

  // Create schedules
  const schedules = await Promise.all([
    prisma.schedule.create({
      data: {
        name: 'Daily Production Backup',
        enabled: true,
        databaseId: databases[0].id, // Production PostgreSQL
        storageId: storageTargets[0].id, // AWS S3
        cronExpression: '0 2 * * *', // Daily at 2 AM
        timezone: 'UTC',
        retentionDays: 30,
        lastRunAt: daysAgo(1),
        nextRunAt: new Date(new Date().setHours(2, 0, 0, 0)),
      },
    }),
    prisma.schedule.create({
      data: {
        name: 'Hourly Staging Backup',
        enabled: true,
        databaseId: databases[1].id, // Staging PostgreSQL
        storageId: storageTargets[1].id, // Cloudflare R2
        cronExpression: '0 * * * *', // Every hour
        timezone: 'UTC',
        retentionDays: 7,
        lastRunAt: new Date(Date.now() - 3600000), // 1 hour ago
        nextRunAt: new Date(Date.now() + 300000), // In 5 minutes
      },
    }),
    prisma.schedule.create({
      data: {
        name: 'Weekly MySQL Backup',
        enabled: true,
        databaseId: databases[2].id, // Production MySQL
        storageId: storageTargets[0].id, // AWS S3
        cronExpression: '0 3 * * 0', // Every Sunday at 3 AM
        timezone: 'America/New_York',
        retentionDays: 90,
        lastRunAt: daysAgo(7),
        nextRunAt: new Date(new Date().setDate(new Date().getDate() + 7 - new Date().getDay())),
      },
    }),
    prisma.schedule.create({
      data: {
        name: 'MongoDB Daily Snapshot',
        enabled: false, // Disabled
        databaseId: databases[3].id, // MongoDB
        storageId: storageTargets[2].id, // Google Drive
        cronExpression: '0 4 * * *', // Daily at 4 AM
        timezone: 'UTC',
        retentionDays: 14,
      },
    }),
  ]);
  console.log(`✓ Created ${schedules.length} backup schedules`);

  // Link some backups to schedules (retroactively)
  const scheduledBackups = backups.filter(b => b.status === 'COMPLETED').slice(0, 20);
  for (const backup of scheduledBackups) {
    const schedule = randomItem(schedules.filter(s => s.databaseId === backup.databaseId));
    if (schedule) {
      await prisma.backup.update({
        where: { id: backup.id },
        data: { scheduleId: schedule.id },
      });
    }
  }
  console.log(`✓ Linked ${scheduledBackups.length} backups to schedules`);

  // Create restore operations
  const completedBackups = backups.filter(b => b.status === 'COMPLETED');
  const restoreStatuses = ['COMPLETED', 'COMPLETED', 'FAILED', 'IN_PROGRESS'];

  const restores = await Promise.all(
    completedBackups.slice(0, 15).map(async (backup) => {
      const status = randomItem(restoreStatuses);
      const startedAt = new Date(backup.completedAt!);
      startedAt.setDate(startedAt.getDate() + random(1, 5)); // Restore a few days after backup

      const duration = status === 'COMPLETED' ? random(60, 600) : random(30, 180);
      const completedAt = status === 'COMPLETED' || status === 'FAILED'
        ? addMinutes(startedAt, Math.floor(duration / 60))
        : null;

      const progress = status === 'COMPLETED' ? 100
        : status === 'FAILED' ? random(20, 80)
          : status === 'IN_PROGRESS' ? random(30, 70)
            : 0;

      return prisma.restore.create({
        data: {
          backupId: backup.id,
          targetHost: null, // Restore to same database
          targetPort: null,
          targetDb: null,
          targetUsername: null,
          targetPassword: null,
          dropExisting: true,
          status,
          progress,
          startedAt,
          completedAt,
          duration: completedAt ? duration : null,
          error: status === 'FAILED'
            ? randomItem([
              'Target database is locked',
              'Insufficient disk space on target',
              'Backup file corrupted or incomplete',
              'Network interruption during restore',
            ])
            : null,
          createdAt: startedAt,
        },
      });
    })
  );
  console.log(`✓ Created ${restores.length} restore operations`);

  // Create application settings
  await prisma.settings.upsert({
    where: { key: 'notifications' },
    update: {},
    create: {
      key: 'notifications',
      value: JSON.stringify({
        email: {
          enabled: true,
          recipients: ['admin@chronostash.com'],
        },
        slack: {
          enabled: true,
          webhookUrl: 'https://hooks.slack.com/services/EXAMPLE',
          channel: '#backups',
          username: 'ChronoStash Bot',
        },
        telegram: {
          enabled: false,
          botToken: '',
          chatId: '',
        },
      }),
    },
  });

  await prisma.settings.upsert({
    where: { key: 'general' },
    update: {},
    create: {
      key: 'general',
      value: JSON.stringify({
        appName: 'ChronoStash',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      }),
    },
  });
  console.log('✓ Created application settings');

  console.log('\n✅ Demo data seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • 2 users (demo/demo123, admin/admin123456)`);
  console.log(`   • ${databases.length} database connections`);
  console.log(`   • ${storageTargets.length} storage targets`);
  console.log(`   • ${backups.length} backup records (35 days of history)`);
  console.log(`   • ${schedules.length} backup schedules`);
  console.log(`   • ${restores.length} restore operations`);
  console.log(`   • 2 application settings`);
  console.log('\n🚀 Login with demo/demo123 to explore!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
