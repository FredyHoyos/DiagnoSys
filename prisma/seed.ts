import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear roles por defecto
  const roles = [
    {
      id: 1,
      name: 'admin',
      displayName: 'Administrator',
      description: 'System administrator with full access'
    },
    {
      id: 2,
      name: 'consultant',
      displayName: 'Consultant',
      description: 'Independent consulting professional'
    },
    {
      id: 3,
      name: 'organization',
      displayName: 'Organization',
      description: 'Company or institutional representative'
    }
  ]

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    })

    if (!existingRole) {
      await prisma.role.create({
        data: role
      })
      console.log(`✅ Created role: ${role.displayName}`)
    } else {
      console.log(`⏭️  Role ${role.displayName} already exists`)
    }
  }

  // ==========================
  // Module: Zoom In
  // ==========================
  const zoomIn = await prisma.module.upsert({
    where: { name: 'Zoom In' },
    update: {},
    create: {
      name: 'Zoom In',
      description: 'Module focused on evaluating internal digital maturity (skills, capabilities, and assets).',
    },
  })

  console.log('✅ Module "Zoom In" created')

  // ==========================
  // Forms under Zoom In
  // ==========================

  const forms = [
    {
      name: 'Skills',
      description: 'Individual competencies needed to operate in digital environments and adopt new technologies.',
      categories: [
        {
          name: 'Basic digital skills',
          examples: [
            'Cloud office tools',
            'Secure navigation',
            'Corporate email use',
          ],
        },
        {
          name: 'Analytical skills',
          examples: [
            'Data interpretation',
            'Critical thinking',
            'Process modeling',
          ],
        },
        {
          name: 'Technical skills',
          examples: [
            'Programming',
            'Database management',
            'Network administration',
          ],
        },
        {
          name: 'Emerging technology skills',
          examples: [
            'Artificial intelligence',
            'Data science',
            'Blockchain',
            'Automation (RPA)',
          ],
        },
        {
          name: 'Digital collaboration skills',
          examples: [
            'Collaborative platforms (MS Teams, Google Workspace, Notion)',
          ],
        },
        {
          name: 'Change management skills',
          examples: [
            'Resilience',
            'Adaptability',
            'Leadership during technological disruption',
          ],
        },
        {
          name: 'Innovation skills',
          examples: [
            'Creativity',
            'Design Thinking',
            'Rapid prototyping',
          ],
        },
        {
          name: 'Cybersecurity skills',
          examples: [
            'Security best practices',
            'Access management',
            'Threat recognition',
          ],
        },
      ],
    },
    {
      name: 'Capabilities',
      description: 'Organizational abilities that enable a company to operate, innovate, and adapt in digital environments.',
      categories: [
        {
          name: 'Operational capabilities',
          examples: [
            'Process automation',
            'BPM',
            'Digital quality control',
            'Traceability',
          ],
        },
        {
          name: 'Commercial capabilities',
          examples: [
            'E-commerce',
            'CRM',
            'Digital marketing',
            'Omnichannel customer experience',
          ],
        },
        {
          name: 'Technological capabilities',
          examples: [
            'IT management',
            'Enterprise architecture',
            'Software development',
            'API management',
          ],
        },
        {
          name: 'Analytical capabilities',
          examples: [
            'Data analytics',
            'Business intelligence',
            'Dashboards',
          ],
        },
        {
          name: 'Strategic capabilities',
          examples: [
            'Data-driven decision-making',
            'Organizational agility',
            'Open innovation',
          ],
        },
        {
          name: 'Knowledge management capabilities',
          examples: [
            'Digital documentation',
            'Learning management',
            'Communities of practice',
          ],
        },
        {
          name: 'Digital sustainability capabilities',
          examples: [
            'Data lifecycle management',
            'Energy efficiency',
            'Circular economy',
          ],
        },
        {
          name: 'Organizational cybersecurity capabilities',
          examples: [
            'Digital risk management',
            'Incident response',
            'Asset protection',
          ],
        },
      ],
    },
    {
      name: 'Strategic Assets',
      description: 'Elements that currently provide direct or indirect economic value to the business.',
      categories: [
        {
          name: 'Digital products and services',
          examples: [
            'Web platforms',
            'Mobile apps',
            'Cloud-based services',
          ],
        },
        {
          name: 'Monetized databases',
          examples: [
            'Customer listings',
            'Product catalogs',
            'Transactional data',
          ],
        },
        {
          name: 'Intellectual property',
          examples: [
            'Patents',
            'Proprietary algorithms',
            'Registered software',
          ],
        },
        {
          name: 'Technological systems and platforms',
          examples: [
            'ERP',
            'CRM',
            'LMS',
            'Automation or integration platforms',
          ],
        },
        {
          name: 'Customer or partner networks',
          examples: [
            'Tech alliances',
            'Marketplaces',
            'Collaborative ecosystems',
          ],
        },
        {
          name: 'Digital business models',
          examples: [
            'Subscription models',
            'Platform economy',
            'SaaS services',
          ],
        },
      ],
    },
    {
      name: 'Hidden Assets',
      description: 'Valuable elements not yet fully exploited or monetized that can enable innovation.',
      categories: [
        {
          name: 'Internal know-how',
          examples: [
            'Team experience',
            'Undocumented best practices',
          ],
        },
        {
          name: 'Internal and external networks',
          examples: [
            'Informal ecosystem contacts',
            'Alumni or inactive partners',
          ],
        },
        {
          name: 'Unstructured knowledge',
          examples: [
            'Scattered documents',
            'Historical data',
            'Unsynthesized customer insights',
          ],
        },
        {
          name: 'Emerging talents',
          examples: [
            'Self-taught skills in AI, blockchain, or low-code tools',
          ],
        },
        {
          name: 'Unoptimized processes',
          examples: [
            'Manual processes that could be digitized',
          ],
        },
        {
          name: 'Unimplemented ideas',
          examples: [
            'Internal proposals',
            'Archived prototypes',
            'Abandoned pilots',
          ],
        },
        {
          name: 'Latent pro-innovation culture',
          examples: [
            'Local initiatives not scaled up',
            'Openness to change',
          ],
        },
      ],
    },
  ]

  // Create all forms with nested categories and items
  for (const formData of forms) {
    const form = await prisma.form.upsert({
      where: { name: formData.name },
      update: {},
      create: {
        name: formData.name,
        description: formData.description,
        moduleId: zoomIn.id,
        categories: {
          create: formData.categories.map(cat => ({
            name: cat.name,
            items: {
              create: cat.examples.map(example => ({
                name: example,
              })),
            },
          })),
        },
      },
    })
    console.log(`✅ Created form: ${form.name}`)
  }

  console.log('🎉 Seeding completed successfully!')

}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

