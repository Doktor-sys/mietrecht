import { PrismaClient, LegalCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateDefinition {
  name: string;
  type: string;
  description: string;
  category: LegalCategory;
  filename: string;
}

const templates: TemplateDefinition[] = [
  {
    name: 'Mietminderungsschreiben',
    type: 'rent_reduction',
    description: 'Schreiben zur Anzeige eines Mangels und Ankündigung einer Mietminderung',
    category: 'RENT_REDUCTION',
    filename: 'rent-reduction-letter.txt'
  },
  {
    name: 'Widerspruch gegen Mieterhöhung',
    type: 'rent_increase_objection',
    description: 'Widerspruch gegen eine Mieterhöhung mit Verweis auf den Mietspiegel',
    category: 'RENT_INCREASE',
    filename: 'rent-increase-objection.txt'
  },
  {
    name: 'Fristsetzung zur Mängelbeseitigung',
    type: 'deadline_letter',
    description: 'Fristsetzung mit Androhung rechtlicher Konsequenzen',
    category: 'REPAIRS',
    filename: 'deadline-letter.txt'
  },
  {
    name: 'Widerspruch gegen Nebenkostenabrechnung',
    type: 'utility_bill_objection',
    description: 'Widerspruch gegen fehlerhafte Nebenkostenabrechnung',
    category: 'UTILITY_COSTS',
    filename: 'utility-bill-objection.txt'
  }
];

async function seedTemplates() {
  console.log('Starting template seeding...');

  const templatesDir = path.join(__dirname, '../../data/templates');

  for (const template of templates) {
    try {
      const filePath = path.join(templatesDir, template.filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`Template file not found: ${template.filename}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      // Prüfe ob Template bereits existiert
      const existing = await prisma.template.findFirst({
        where: {
          type: template.type,
          language: 'de'
        }
      });

      if (existing) {
        // Update existing template
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            name: template.name,
            description: template.description,
            content,
            category: template.category,
            isActive: true
          }
        });
        console.log(`✓ Updated template: ${template.name}`);
      } else {
        // Create new template
        await prisma.template.create({
          data: {
            name: template.name,
            type: template.type,
            description: template.description,
            content,
            category: template.category,
            language: 'de',
            isActive: true
          }
        });
        console.log(`✓ Created template: ${template.name}`);
      }
    } catch (error) {
      console.error(`✗ Error processing template ${template.name}:`, error);
    }
  }

  console.log('Template seeding completed!');
}

seedTemplates()
  .catch((error) => {
    console.error('Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
