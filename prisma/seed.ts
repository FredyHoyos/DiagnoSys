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

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
