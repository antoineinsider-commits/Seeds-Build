import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Get(':problemId')
  async getMatchesForProblem(@Param('problemId', ParseUUIDPipe) problemId: string) {
    return this.matchingService.calculateMatches(problemId);
  }
}
