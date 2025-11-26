import { PrismaClient, UserType, LegalCategory, LegalType, DocumentType } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Erstelle Test-Benutzer
  const hashedPassword = await bcrypt.hash('password123', 12)

  const testTenant = await prisma.user.upsert({
    where: { email: 'mieter@test.de' },
    update: {},
    create: {
      email: 'mieter@test.de',
      passwordHash: hashedPassword,
      userType: UserType.TENANT,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Max',
          lastName: 'Mustermann',
          location: 'Berlin',
          language: 'de',
        },
      },
      preferences: {
        create: {
          language: 'de',
        },
      },
    },
  })

  const testLandlord = await prisma.user.upsert({
    where: { email: 'vermieter@test.de' },
    update: {},
    create: {
      email: 'vermieter@test.de',
      passwordHash: hashedPassword,
      userType: UserType.LANDLORD,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Anna',
          lastName: 'Vermieterin',
          location: 'München',
          language: 'de',
        },
      },
      preferences: {
        create: {
          language: 'de',
        },
      },
    },
  })

  console.log('✅ Test-Benutzer erstellt')

  // Erstelle Rechtsdaten (BGB-Paragraphen)
  const legalKnowledgeData = [
    {
      type: LegalType.LAW,
      reference: '§ 536 BGB',
      title: 'Minderung der Miete bei Sach- und Rechtsmängeln',
      content: 'Hat die Mietsache zur Zeit der Überlassung an den Mieter einen Mangel, der ihre Tauglichkeit zum vertragsgemäßen Gebrauch aufhebt oder mindert, oder entsteht während der Mietzeit ein solcher Mangel, so ist der Mieter für die Zeit, in der die Tauglichkeit aufgehoben oder gemindert ist, von der Entrichtung der Miete befreit oder zur Entrichtung nur einer angemessen herabgesetzten Miete verpflichtet.',
      jurisdiction: 'Deutschland',
      effectiveDate: new Date('2002-01-01'),
      tags: ['Mietminderung', 'Mangel', 'BGB'],
    },
    {
      type: LegalType.LAW,
      reference: '§ 573 BGB',
      title: 'Ordentliche Kündigung des Vermieters',
      content: 'Der Vermieter kann nur kündigen, wenn er ein berechtigtes Interesse an der Beendigung des Mietverhältnisses hat. Die Kündigung zum Zwecke der Mieterhöhung ist ausgeschlossen.',
      jurisdiction: 'Deutschland',
      effectiveDate: new Date('2001-09-01'),
      tags: ['Kündigung', 'Vermieter', 'BGB'],
    },
    {
      type: LegalType.LAW,
      reference: '§ 558 BGB',
      title: 'Mieterhöhung bis zur ortsüblichen Vergleichsmiete',
      content: 'Der Vermieter kann die Zustimmung zu einer Erhöhung der Miete bis zur ortsüblichen Vergleichsmiete verlangen, wenn die Miete seit 15 Monaten unverändert ist.',
      jurisdiction: 'Deutschland',
      effectiveDate: new Date('2001-09-01'),
      tags: ['Mieterhöhung', 'Mietspiegel', 'BGB'],
    },
    {
      type: LegalType.LAW,
      reference: '§ 535 BGB',
      title: 'Inhalt und Hauptpflichten des Mietvertrags',
      content: 'Durch den Mietvertrag wird der Vermieter verpflichtet, dem Mieter den Gebrauch der Mietsache während der Mietzeit zu gewähren. Der Vermieter hat die Mietsache dem Mieter in einem zum vertragsgemäßen Gebrauch geeigneten Zustand zu überlassen und sie während der Mietzeit in diesem Zustand zu erhalten.',
      jurisdiction: 'Deutschland',
      effectiveDate: new Date('2002-01-01'),
      tags: ['Mietvertrag', 'Pflichten', 'BGB'],
    },
  ]

  for (const legal of legalKnowledgeData) {
    await prisma.legalKnowledge.upsert({
      where: { reference: legal.reference },
      update: {},
      create: legal,
    })
  }

  console.log('✅ Rechtsdaten erstellt')

  // Erstelle Test-Anwälte
  const testLawyers = [
    {
      name: 'Dr. Petra Rechtmann',
      email: 'p.rechtmann@kanzlei.de',
      specializations: ['Mietrecht', 'Wohnungseigentumsrecht'],
      location: 'Berlin',
      rating: 4.8,
      reviewCount: 127,
      hourlyRate: 250.0,
      languages: ['de', 'en'],
      verified: true,
    },
    {
      name: 'RA Michael Mieter',
      email: 'm.mieter@anwalt.de',
      specializations: ['Mietrecht', 'Verbraucherschutz'],
      location: 'München',
      rating: 4.6,
      reviewCount: 89,
      hourlyRate: 200.0,
      languages: ['de'],
      verified: true,
    },
    {
      name: 'Dr. Sarah Wohnrecht',
      email: 's.wohnrecht@law.de',
      specializations: ['Mietrecht', 'Immobilienrecht'],
      location: 'Hamburg',
      rating: 4.9,
      reviewCount: 203,
      hourlyRate: 300.0,
      languages: ['de', 'en', 'tr'],
      verified: true,
    },
  ]

  for (const lawyer of testLawyers) {
    await prisma.lawyer.upsert({
      where: { email: lawyer.email },
      update: {},
      create: lawyer,
    })
  }

  console.log('✅ Test-Anwälte erstellt')

  // Erstelle Mietspiegel-Daten
  const mietspiegelData = [
    {
      city: 'Berlin',
      year: 2023,
      averageRent: 12.50,
      rentRanges: [
        { minRent: 8.50, maxRent: 16.20, category: 'Altbau bis 1918', conditions: ['einfache Ausstattung'] },
        { minRent: 10.80, maxRent: 18.90, category: 'Neubau ab 2014', conditions: ['gehobene Ausstattung'] },
      ],
      specialRegulations: ['Mietendeckel (aufgehoben)', 'Milieuschutz in bestimmten Gebieten'],
    },
    {
      city: 'München',
      year: 2023,
      averageRent: 18.20,
      rentRanges: [
        { minRent: 12.40, maxRent: 24.80, category: 'Altbau bis 1918', conditions: ['zentrale Lage'] },
        { minRent: 15.60, maxRent: 28.90, category: 'Neubau ab 2014', conditions: ['Premiumlage'] },
      ],
      specialRegulations: ['Verschärfte Mietpreisbremse', 'Kappungsgrenze 15%'],
    },
  ]

  for (const mietspiegel of mietspiegelData) {
    await prisma.mietspiegelData.upsert({
      where: { city_year: { city: mietspiegel.city, year: mietspiegel.year } },
      update: {},
      create: mietspiegel,
    })
  }

  console.log('✅ Mietspiegel-Daten erstellt')

  // Erstelle Templates
  const templates = [
    {
      name: 'Mietminderung wegen Heizungsausfall',
      type: 'rent_reduction',
      description: 'Musterschreiben für Mietminderung bei defekter Heizung',
      content: `Sehr geehrte Damen und Herren,

hiermit teile ich Ihnen mit, dass in meiner Wohnung ({{address}}) seit dem {{defect_date}} die Heizung ausgefallen ist.

Aufgrund dieses erheblichen Mangels mindere ich die Miete ab dem {{reduction_start_date}} um {{reduction_percentage}}%.

Die rechtliche Grundlage hierfür ergibt sich aus § 536 BGB.

Ich bitte Sie, den Mangel umgehend zu beseitigen.

Mit freundlichen Grüßen
{{tenant_name}}`,
      category: LegalCategory.RENT_REDUCTION,
      language: 'de',
    },
    {
      name: 'Widerspruch gegen Mieterhöhung',
      type: 'rent_increase_objection',
      description: 'Musterschreiben für Widerspruch gegen Mieterhöhung',
      content: `Sehr geehrte Damen und Herren,

Ihr Schreiben vom {{letter_date}} bezüglich der Mieterhöhung habe ich erhalten.

Hiermit widerspreche ich der beabsichtigten Mieterhöhung aus folgenden Gründen:
{{objection_reasons}}

Die vorgeschlagene Miete liegt über der ortsüblichen Vergleichsmiete gemäß Mietspiegel.

Mit freundlichen Grüßen
{{tenant_name}}`,
      category: LegalCategory.RENT_INCREASE,
      language: 'de',
    },
  ]

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    })
  }

  console.log('✅ Templates erstellt')

  console.log('🎉 Seeding abgeschlossen!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding fehlgeschlagen:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })