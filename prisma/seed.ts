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
  // Module: Zoom Out
  // ==========================
  const zoomOut = await prisma.module.upsert({
    where: { name: 'Zoom Out' },
    update: {},
    create: {
      name: 'Zoom Out',
      description: 'Module focused on evaluating external forces that exert positive or negative pressure on the business model.',
    },
  })

  console.log('✅ Module "Zoom Out" created')

  // ==========================
  // Forms under Zoom In
  // ==========================

  const zoomInForms = [
    {
      name: 'Skills',
      tag: 'Skills',
      description: 'Individual competencies needed to operate in digital environments and adopt new technologies.',
      categories: [
        {
          name: 'Basic digital skills',
          examples: [
            'Cloud office management',
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
      tag: 'Capabilities',
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
      tag: 'Strategic Assets',
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
      tag: 'Hidden Assets',
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

  // ==========================
  // Forms under Zoom Out
  // ==========================

  const zoomOutForms = [
    {
      name: 'Key Trends',
      tag: 'Trends',
      description: 'Global technological, social or cultural changes that directly or indirectly affect market behavior and business models.',
      categories: [
        {
          name: 'Technology and digitalization',
          examples: [
            'Growing adoption of artificial intelligence',
            'Digitalization of the value chain',
            'Cloud computing expansion',
            'Intelligent automation (RPA + AI)',
            'Rise of low-code/no-code platforms',
          ],
        },
        {
          name: 'Clients and market',
          examples: [
            'Remote work growth',
            'Data usage as new strategic asset',
          ],
        },
        {
          name: 'Talent and security',
          examples: [
            'Demand for sustainability and circular economy',
            'Integration of immersive technologies (AR/VR)',
          ],
        },
        {
          name: 'Strategy and regulation',
          examples: [
            'Transition towards data-driven business models',
          ],
        },
      ],
    },
    {
      name: 'Market Forces',
      tag: 'Market',
      description: 'Changing dynamics and expectations of consumers and the competitive environment that directly influence an organization\'s value proposition.',
      categories: [
        {
          name: 'Clients and market',
          examples: [
            'Change in digital customer expectations',
            'Increased competition through digital channels',
            'Acceleration of disruptive business models',
            'More informed and demanding customers',
            'Preference for personalized experiences',
            'Growth of marketplaces',
            'Pressure for reduced delivery times',
            'Hyper-personalization of services',
            'Omnichannel attention demand',
            'Requirement for transparency and traceability',
          ],
        },
      ],
    },
    {
      name: 'Industry Forces',
      tag: 'Industry',
      description: 'Technological, structural or regulatory changes that affect competition dynamics in a specific sector or that come from key agents such as competitors, suppliers or dominant platforms.',
      categories: [
        {
          name: 'Technology and digitalization',
          examples: [
            'Industrial process automation',
            'Consolidation of large digital platforms',
            'New interoperability standards',
            'Adoption of international digital quality standards',
          ],
        },
        {
          name: 'Talent and security',
          examples: [
            'Disintermediation by technological platforms',
            'Pressure to integrate operational intelligence',
            'Consolidation of vertical ecosystems',
            'Competition with tech startups',
          ],
        },
        {
          name: 'Strategy and regulation',
          examples: [
            'Sectoral regulatory pressure',
          ],
        },
        {
          name: 'Clients and market',
          examples: [
            'Transformation of traditional logistics chains',
          ],
        },
      ],
    },
    {
      name: 'Macroeconomic Forces',
      tag: 'Macroeconomic',
      description: 'Global or regional political, economic or legal factors that directly or indirectly impact strategic and operational decisions of organizations.',
      categories: [
        {
          name: 'Strategy and regulation',
          examples: [
            'Data protection regulations',
            'Digital transformation incentive policies',
            'Currency fluctuations impacting technology',
            'Tax policies for digital services',
            'Government incentives for innovation',
            'Geopolitical risks affecting supply chain',
            'Commercial restrictions on key technologies',
            'International digital governance frameworks',
          ],
        },
        {
          name: 'Talent and security',
          examples: [
            'Inflation and shortage of technological talent',
            'Increase in global cyber threats',
          ],
        },
      ],
    },
  ]

  // Create all Zoom In forms with nested categories and items
  for (const formData of zoomInForms) {
    const form = await prisma.form.upsert({
      where: { name: formData.name },
      update: {},
      create: {
        name: formData.name,
        description: formData.description,
        tag: formData.tag,
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
    console.log(`✅ Created Zoom In form: ${form.name}`)
  }

  // Create all Zoom Out forms with nested categories and items
  for (const formData of zoomOutForms) {
    const form = await prisma.form.upsert({
      where: { name: formData.name },
      update: {},
      create: {
        name: formData.name,
        description: formData.description,
        tag: formData.tag,
        moduleId: zoomOut.id,
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
    console.log(`✅ Created Zoom Out form: ${form.name}`)
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

