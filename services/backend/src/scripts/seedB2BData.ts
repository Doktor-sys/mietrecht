import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seedB2BData() {
  console.log('🌱 Seeding B2B data...');

  try {
    // Erstelle Test-Organisationen
    const organizations = await Promise.all([
      prisma.organization.create({
        data: {
          name: 'Berliner Wohnungsgenossenschaft eG',
          plan: 'professional',
          isActive: true,
        },
      }),
      prisma.organization.create({
        data: {
          name: 'Immobilien Management GmbH',
          plan: 'enterprise',
          isActive: true,
        },
      }),
      prisma.organization.create({
        data: {
          name: 'Hausverwaltung Schmidt & Partner',
          plan: 'basic',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${organizations.length} organizations`);

    // Erstelle API-Keys für jede Organisation
    const apiKeys = [];
    
    for (const org of organizations) {
      const keyPrefix = org.plan === 'enterprise' ? 'sk_live' : 'sk_test';
      const keyValue = `${keyPrefix}_${crypto.randomBytes(24).toString('hex')}`;
      
      let permissions: string[];
      let rateLimit: number;
      let quotaLimit: number;

      switch (org.plan) {
        case 'enterprise':
          permissions = ['*'];
          rateLimit = 10000;
          quotaLimit = 1000000;
          break;
        case 'professional':
          permissions = [
            'document:analyze',
            'document:batch',
            'chat:query',
            'template:generate',
            'lawyer:search',
            'analytics:read',
          ];
          rateLimit = 5000;
          quotaLimit = 100000;
          break;
        case 'basic':
        default:
          permissions = [
            'document:analyze',
            'chat:query',
            'template:generate',
          ];
          rateLimit = 1000;
          quotaLimit = 10000;
          break;
      }

      const apiKey = await prisma.apiKey.create({
        data: {
          key: keyValue,
          name: `${org.name} - Production Key`,
          organizationId: org.id,
          permissions,
          rateLimit,
          quotaLimit,
          quotaUsed: Math.floor(Math.random() * (quotaLimit * 0.1)), // 0-10% verwendet
          isActive: true,
        },
      });

      apiKeys.push(apiKey);

      // Erstelle auch einen Test-Key
      const testKeyValue = `sk_test_${crypto.randomBytes(24).toString('hex')}`;
      await prisma.apiKey.create({
        data: {
          key: testKeyValue,
          name: `${org.name} - Test Key`,
          organizationId: org.id,
          permissions,
          rateLimit: Math.floor(rateLimit * 0.1), // 10% des Production Limits
          quotaLimit: Math.floor(quotaLimit * 0.1),
          quotaUsed: 0,
          isActive: true,
        },
      });
    }

    console.log(`✅ Created ${apiKeys.length * 2} API keys`);

    // Erstelle Sample-Daten für Analytics
    for (const apiKey of apiKeys) {
      // API Requests (letzte 30 Tage)
      const requests = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dailyRequests = Math.floor(Math.random() * 100) + 10;
        
        for (let j = 0; j < dailyRequests; j++) {
          const requestTime = new Date(date);
          requestTime.setHours(Math.floor(Math.random() * 24));
          requestTime.setMinutes(Math.floor(Math.random() * 60));
          
          requests.push({
            apiKeyId: apiKey.id,
            method: ['GET', 'POST'][Math.floor(Math.random() * 2)],
            path: [
              '/api/b2b/status',
              '/api/b2b/chat/query',
              '/api/b2b/analyze/document',
              '/api/b2b/templates/generate',
              '/api/b2b/lawyers/search',
            ][Math.floor(Math.random() * 5)],
            userAgent: 'SmartLaw-SDK/1.0.0',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            createdAt: requestTime,
          });
        }
      }

      await prisma.apiRequest.createMany({
        data: requests,
      });

      // Chat Interactions
      const chatInteractions = [];
      for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        chatInteractions.push({
          organizationId: apiKey.organizationId,
          sessionId: `session_${uuidv4()}`,
          query: [
            'Kann ich die Miete wegen defekter Heizung mindern?',
            'Welche Fristen gelten bei Kündigungen?',
            'Sind Schönheitsreparaturen Pflicht?',
            'Wie hoch darf die Kaution sein?',
            'Was tun bei Mieterhöhung?',
          ][Math.floor(Math.random() * 5)],
          response: 'Basierend auf den aktuellen Gesetzen...',
          confidence: 0.7 + Math.random() * 0.3,
          legalReferences: [
            { reference: '§ 536 BGB', title: 'Minderung bei Sach- und Rechtsmängeln' },
          ],
          createdAt: date,
        });
      }

      await prisma.chatInteraction.createMany({
        data: chatInteractions,
      });

      // Template Generations
      const templateGenerations = [];
      for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        templateGenerations.push({
          organizationId: apiKey.organizationId,
          templateType: [
            'rent_reduction_letter',
            'termination_objection',
            'utility_bill_objection',
            'deadline_letter',
          ][Math.floor(Math.random() * 4)],
          inputData: {
            tenantName: 'Max Mustermann',
            landlordName: 'Vermieter GmbH',
            issue: 'Defekte Heizung',
          },
          generatedContent: 'Sehr geehrte Damen und Herren, hiermit teile ich Ihnen mit...',
          createdAt: date,
        });
      }

      await prisma.templateGeneration.createMany({
        data: templateGenerations,
      });
    }

    console.log('✅ Created sample analytics data');

    // Erstelle Webhooks
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      
      await prisma.webhook.create({
        data: {
          organizationId: org.id,
          url: `https://api.${org.name.toLowerCase().replace(/\s+/g, '-')}.de/webhooks/smartlaw`,
          events: [
            'document.analyzed',
            'batch.completed',
            'chat.escalated',
            'template.generated',
          ],
          secret: `whsec_${crypto.randomBytes(32).toString('hex')}`,
          isActive: true,
        },
      });
    }

    console.log('✅ Created webhooks');

    // Erstelle Batch Jobs
    for (const org of organizations) {
      await prisma.batchJob.create({
        data: {
          organizationId: org.id,
          type: 'document_analysis',
          status: 'completed',
          totalItems: 25,
          processedItems: 25,
          metadata: {
            documents: Array.from({ length: 25 }, (_, i) => ({
              id: `doc_${i + 1}`,
              type: 'rental_contract',
            })),
          },
          startedAt: new Date(Date.now() - 3600000), // 1 Stunde ago
          completedAt: new Date(Date.now() - 1800000), // 30 Minuten ago
        },
      });

      await prisma.batchJob.create({
        data: {
          organizationId: org.id,
          type: 'document_analysis',
          status: 'processing',
          totalItems: 15,
          processedItems: 8,
          metadata: {
            documents: Array.from({ length: 15 }, (_, i) => ({
              id: `doc_batch2_${i + 1}`,
              type: 'utility_bill',
            })),
          },
          startedAt: new Date(Date.now() - 600000), // 10 Minuten ago
        },
      });
    }

    console.log('✅ Created batch jobs');

    // Ausgabe der API-Keys für Tests
    console.log('\n📋 API Keys für Tests:');
    console.log('=' .repeat(80));
    
    const allApiKeys = await prisma.apiKey.findMany({
      include: {
        organization: {
          select: {
            name: true,
            plan: true,
          },
        },
      },
    });

    for (const key of allApiKeys) {
      console.log(`Organization: ${key.organization.name}`);
      console.log(`Plan: ${key.organization.plan}`);
      console.log(`Key Name: ${key.name}`);
      console.log(`API Key: ${key.key}`);
      console.log(`Permissions: ${key.permissions.join(', ')}`);
      console.log(`Rate Limit: ${key.rateLimit}/min`);
      console.log(`Quota: ${key.quotaUsed}/${key.quotaLimit}`);
      console.log('-'.repeat(80));
    }

    console.log('\n🎉 B2B data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding B2B data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Führe Seeding aus wenn direkt aufgerufen
if (require.main === module) {
  seedB2BData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedB2BData };