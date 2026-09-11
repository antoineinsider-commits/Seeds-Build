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
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // SECURITY: never fall back to a hardcoded/default secret. A missing
      // JWT_SECRET must crash the app at boot, not silently sign and
      // verify tokens with a value anyone reading this source can forge.
      throw new Error(
        'JWT_SECRET is not set. Refusing to start: falling back to a default ' +
          'signing secret would let anyone forge valid session tokens.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
