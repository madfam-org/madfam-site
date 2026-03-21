import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create feature flags
  const featureFlags = [
    {
      key: 'NEW_LEAD_SCORING',
      name: 'AI Lead Scoring v2',
      description: 'Enhanced AI-powered lead scoring algorithm',
      enabled: false,
      enabledDev: true,
      enabledStaging: true,
      enabledProd: false,
      rolloutPercentage: 10,
    },
    {
      key: 'INTERACTIVE_CALCULATOR',
      name: 'ROI Calculator',
      description: 'Interactive ROI calculator for services',
      enabled: true,
      enabledDev: true,
      enabledStaging: true,
      enabledProd: true,
    },
    {
      key: 'CHAT_SUPPORT',
      name: 'Live Chat Support',
      description: 'Real-time chat with support team',
      enabled: false,
      enabledDev: true,
      enabledStaging: false,
      enabledProd: false,
    },
    {
      key: 'PORTUGUESE_LOCALE',
      name: 'Portuguese Language',
      description: 'Full Portuguese (BR) translation',
      enabled: true,
      enabledDev: true,
      enabledStaging: true,
      enabledProd: true,
    },
    {
      key: 'ADVANCED_ANALYTICS_DASHBOARD',
      name: 'Advanced Analytics Dashboard',
      description: 'Enhanced analytics and reporting features',
      enabled: false,
      enabledDev: true,
      enabledStaging: false,
      enabledProd: false,
    },
    {
      key: 'N8N_WORKFLOWS',
      name: 'n8n Workflow Integration',
      description: 'Automated workflows via n8n',
      enabled: true,
      enabledDev: true,
      enabledStaging: true,
      enabledProd: true,
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
  }

  console.log(`✅ Created ${featureFlags.length} feature flags`);

  // Create integrations
  const integrations = [
    {
      name: 'n8n',
      enabled: false,
      config: {
        webhookUrl: 'https://n8n.madfam.io/webhook',
        apiKey: 'encrypted_api_key',
      },
    },
    {
      name: 'slack',
      enabled: false,
      config: {
        webhookUrl: 'https://hooks.slack.com/services/xxx',
      },
    },
    {
      name: 'plausible',
      enabled: true,
      config: {
        domain: 'madfam.io',
        apiKey: 'encrypted_api_key',
      },
    },
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: integration,
      create: integration,
    });
  }

  console.log(`✅ Created ${integrations.length} integrations`);

  // Create a test admin user
  const adminPassword = await hashPassword('admin123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@madfam.io' },
    update: {},
    create: {
      email: 'admin@madfam.io',
      name: 'MADFAM Admin',
      role: 'ADMIN',
      passwordHash: adminPassword,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create a test editor user
  const editorPassword = await hashPassword('editor123!');
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@madfam.io' },
    update: {},
    create: {
      email: 'editor@madfam.io',
      name: 'MADFAM Editor',
      role: 'EDITOR',
      passwordHash: editorPassword,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created editor user:', editorUser.email);

  console.log('🎉 Database seed completed!');
}

main()
  .catch(error => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
