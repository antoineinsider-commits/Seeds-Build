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

    // High performance read path: Retrieve candidate solution listings in target category
    const candidates = await this.prisma.listing.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        solver: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const scoredMatches: MatchScoreResult[] = candidates.map((listing) => {
      // 1. Category & Domain Match (30 Weight)
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
  }
}
