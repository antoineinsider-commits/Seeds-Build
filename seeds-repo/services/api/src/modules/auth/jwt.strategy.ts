import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import { UserJwtPayload } from '@seeds/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'FALLBACK_SECRET_CHANGE_IMMEDIATELY',
    });
  }

  async validate(payload: UserJwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { seekerProfile: true, solverProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists or session is invalid');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      seekerProfileId: user.seekerProfile?.id,
      solverProfileId: user.solverProfile?.id,
    };
  }
}