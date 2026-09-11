import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Matching System (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('calculates scored matches for a valid problem', async () => {
    // Setup Test Data
    const seekerUser = await prisma.user.create({
      data: {
        email: `test_seeker_${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        role: 'SEEKER',
      },
    });

    const seeker = await prisma.seekerProfile.create({
      data: {
        userId: seekerUser.id,
        name: 'Test Seeker',
      },
    });

    const problem = await prisma.problem.create({
      data: {
        seekerId: seeker.id,
        title: 'POS Order Processing Failure',
        description: 'Orders dropping during peak dinner rush.',
        industry: 'Hospitality',
        urgency: 'High',
        budgetMin: 1000,
        budgetMax: 5000,
        category: 'Software & Technology',
        tags: ['POS', 'Kitchen'],
      },
    });

    // Execute Request
    const response = await request(app.getHttpServer())
      .get(`/api/v1/matching/${problem.id}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });
});
