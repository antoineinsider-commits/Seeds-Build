import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { SignupDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // dto.role is constrained to 'SEEKER' | 'SOLVER' by SignupDto's
    // @IsIn validation.
    const role = dto.role as Role;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,

        // NOTE: auto-verifying email here is still an MVP shortcut.
        // A real email-verification flow should replace this before launch.
        isEmailVerified: true,

        ...(role === Role.SEEKER
          ? {
              seekerProfile: {
                create: {
                  name: dto.name,
                  organization: dto.organization,
                },
              },
            }
          : {
              solverProfile: {
                create: {
                  companyName: dto.name,
                  bio: dto.organization || '',
                },
              },
            }),
      },
      include: {
        seekerProfile: true,
        solverProfile: true,
      },
    });

    return this.generateTokens(
      user.id,
      user.email,
      user.role,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Keep the same response for unknown emails and wrong passwords
      // so we do not reveal whether an account exists.
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // SECURITY: inactive accounts must never receive new tokens.
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated',
      );
    }

    return this.generateTokens(
      user.id,
      user.email,
      user.role,
    );
  }

  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const storedToken =
      await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Refresh token is invalid or expired',
      );
    }

    if (storedToken.isRevoked) {
      // SECURITY: replay of a revoked refresh token is treated
      // as a possible token compromise.
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      throw new UnauthorizedException(
        'Refresh token is invalid or expired',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token is invalid or expired',
      );
    }

    // SECURITY: deactivated users must not be able to obtain
    // new access tokens through refresh.
    if (!storedToken.user.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      throw new UnauthorizedException(
        'Your account has been deactivated',
      );
    }

    // Revoke old refresh token (token rotation security).
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(
      payload,
      {
        secret: this.configService.get<string>(
          'JWT_SECRET',
        ),
        expiresIn: '15m',
      },
    );

    const rawRefreshToken = crypto
      .randomBytes(40)
      .toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}