import { PrismaClient, Role, VerificationStatus, SolutionType, Visibility, PlanTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing records
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.request.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.solverProfile.deleteMany();
  await prisma.seekerProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@seeds.platform',
      passwordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  // 2. Create Seeker User & Profile
  const seekerUser = await prisma.user.create({
    data: {
      email: 'seeker@restaurantgroup.com',
      passwordHash,
      role: Role.SEEKER,
      isEmailVerified: true,
      seekerProfile: {
        create: {
          name: 'Elena Rostova',
          organization: 'Apex Dining Group',
          industry: 'Hospitality',
          location: 'Chicago, IL',
        },
      },
    },
    include: { seekerProfile: true },
  });

  // 3. Create Solver User & Profile (Verified)
  const solverUser = await prisma.user.create({
    data: {
      email: 'solver@kitchenpulse.io',
      passwordHash,
      role: Role.SOLVER,
      isEmailVerified: true,
      solverProfile: {
        create: {
          companyName: 'KitchenPulse Automation',
          bio: 'Specialized POS and inventory integration services for multi-location hospitality chains.',
          skills: ['POS Integration', 'Inventory Management', 'Node.js', 'PostgreSQL'],
          industries: ['Hospitality', 'Retail'],
          verificationStatus: VerificationStatus.VERIFIED,
          rating: 4.9,
          reviewCount: 18,
          subscription: {
            create: {
              plan: PlanTier.PRO,
              status: 'active',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    },
    include: { solverProfile: true },
  });

  // 4. Create Sample Problem
  const problem = await prisma.problem.create({
    data: {
      seekerId: seekerUser.seekerProfile!.id,
      title: 'Peak-Hour Food Waste from Inventory Prediction Delays',
      description: 'Our 5 restaurant locations experience high ingredient spoilage due to manual stock ordering that fails to adjust for weekend surge volume.',
      industry: 'Hospitality',
      urgency: 'High',
      budgetMin: 1000,
      budgetMax: 5000,
      visibility: Visibility.PUBLIC,
      category: 'Software & Technology',
      tags: ['Inventory', 'POS', 'Automation', 'Hospitality'],
      preferredSolution: SolutionType.DONE_FOR_YOU_SERVICE,
    },
  });

  // 5. Create Sample Listing
  const listing = await prisma.listing.create({
    data: {
      solverId: solverUser.solverProfile!.id,
      title: 'Automated POS Inventory Sync & Order Trigger Engine',
      solutionType: SolutionType.DONE_FOR_YOU_SERVICE,
      problemItSolves: 'Eliminates food waste and stockouts by syncing real-time POS sales directly with supplier portals.',
      targetCustomer: 'Multi-unit restaurants and specialty food retail stores.',
      description: 'We deploy a custom middleware solution that connects Toast/Square POS directly to US Foods/Sysco portals for automatic reordering.',
      pricingModel: 'Fixed',
      priceMin: 2500,
      priceMax: 4000,
      deliveryTimeDays: 14,
      category: 'Software & Technology',
      tags: ['POS', 'Inventory', 'Automation'],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 12,
    },
  });

  console.log('Seeding completed successfully:');
  console.log(` - Admin Account: admin@seeds.platform / Password123!`);
  console.log(` - Seeker Account: seeker@restaurantgroup.com / Password123!`);
  console.log(` - Solver Account: solver@kitchenpulse.io / Password123!`);
  console.log(` - Created Problem ID: ${problem.id}`);
  console.log(` - Created Listing ID: ${listing.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });