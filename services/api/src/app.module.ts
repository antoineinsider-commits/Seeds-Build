import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MatchingModule } from './modules/matching/matching.module';
import { RequestsLeadsModule } from './modules/requests-leads/requests-leads.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate Limiting: 100 requests per 60 seconds
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    UsersModule,
    ProblemsModule,
    ListingsModule,
    MatchingModule,
    RequestsLeadsModule,
    ProposalsModule,
    ReviewsModule,
    BillingModule,
    AdminModule,
    ReportsModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
