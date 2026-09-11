import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Listing, VerificationStatus } from '@prisma/client';

export interface MatchScoreResult {
  listing: Listing;
  totalScore: number;
  breakdown: {
    categoryMatchScore: number;
    keywordScore: number;
    preferenceScore: number;
    qualityRankScore: number;
  };
}

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  async calculateMatches(problemId: string, limit = 10): Promise<MatchScoreResult[]> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new Error('Problem statement not found');
    }

    // SCALE: the previous version loaded every VERIFIED listing on the
    // entire platform into memory on every single match request — fine at
    // dozens of listings, a real bottleneck at thousands, and a serious
    // problem at the "millions of users" scale this project targets.
    // Pre-filtering by category at the database level (indexed via
    // @@index([category, solutionType]) in schema.prisma) cuts the
    // candidate set dramatically before it ever reaches app memory.
    //
    // This is still not the final answer — see the TODO below — but it's
    // a meaningful improvement over loading the whole table.
    const candidates = await this.prisma.listing.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        category: problem.category,
      },
      include: {
        solver: {
          include: {
            subscription: true,
          },
        },
      },
      // Hard cap on candidates considered per request, independent of the
      // final `limit` returned — prevents a category with tens of
      // thousands of listings from still loading unbounded rows.
      take: 500,
    });

    const scoredMatches: MatchScoreResult[] = candidates.map((listing) => {
      // 1. Category & Domain Match (30 Weight)
      // Already filtered to matching category above, so this is always 30
      // for anything that reached this point — kept explicit so the
      // scoring breakdown stays meaningful if the query filter is ever
      // loosened (e.g. to include adjacent categories) in the future.
      let categoryMatchScore = 0;
      if (listing.category.toLowerCase() === problem.category.toLowerCase()) {
        categoryMatchScore = 30;
      }

      // 2. Keyword & Tag Overlap (30 Weight)
      const problemKeywords = [...problem.tags, ...problem.title.toLowerCase().split(' ')];
      const listingKeywords = [...listing.tags, ...listing.title.toLowerCase().split(' ')];
      const overlap = problemKeywords.filter((kw) => listingKeywords.includes(kw)).length;
      const keywordScore = Math.min(30, overlap * 10);

      // 3. Seeker Preference Match (20 Weight)
      let preferenceScore = 0;
      if (problem.preferredSolution && listing.solutionType === problem.preferredSolution) {
        preferenceScore += 10;
      }
      if (listing.priceMin <= problem.budgetMax && listing.priceMin >= problem.budgetMin) {
        preferenceScore += 10;
      }

      // 4. Quality & Verification Score (20 Weight)
      let qualityRankScore = 0;
      if (listing.solver.verificationStatus === VerificationStatus.VERIFIED) {
        qualityRankScore += 10;
      }
      // Add rating impact (max 5)
      qualityRankScore += Math.min(5, (listing.rating / 5) * 5);
      // Boost for featured / pro tier (max 5)
      if (listing.isFeatured || listing.solver.subscription?.plan === 'PRO') {
        qualityRankScore += 5;
      }

      const totalScore = categoryMatchScore + keywordScore + preferenceScore + qualityRankScore;

      return {
        listing,
        totalScore,
        breakdown: {
          categoryMatchScore,
          keywordScore,
          preferenceScore,
          qualityRankScore,
        },
      };
    });

    // Sort descending by calculated score
    return scoredMatches.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);
    // TODO (scale): at real volume this whole approach — load candidates,
    // score in application code, sort in memory — should move to either
    // (a) a precomputed/cached score refreshed on listing changes, or
    // (b) a proper search index (OpenSearch/pgvector) doing the ranking,
    // per MASTER_AI_BUILD_PROMPT.md Section 3.1. This fix reduces the
    // immediate blast radius; it does not make the endpoint cache-free-safe
    // at "millions of users" scale on its own.
  }
}
