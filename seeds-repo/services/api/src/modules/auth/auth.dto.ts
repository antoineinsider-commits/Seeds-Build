import { IsEmail, IsString, MinLength, MaxLength, IsIn, IsOptional } from 'class-validator';

// SECURITY: only SEEKER and SOLVER may self-register via the public signup
// endpoint. ADMIN/SUPER_ADMIN accounts must never be creatable from a
// public request body — they are created by an existing admin or a
// trusted seed/migration script only. If you add more public-facing
// roles later, extend PUBLIC_SIGNUP_ROLES, not the underlying Role enum
// check, so this stays an explicit allowlist rather than "everything
// except admin".
export const PUBLIC_SIGNUP_ROLES = ['SEEKER', 'SOLVER'] as const;
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export class SignupDto {
  @IsEmail()
  @MaxLength(254) // RFC 5321 max email length
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128) // prevents oversized-input abuse against bcrypt
  password!: string;

  @IsIn(PUBLIC_SIGNUP_ROLES, {
    message: `role must be one of: ${PUBLIC_SIGNUP_ROLES.join(', ')}`,
  })
  role!: PublicSignupRole;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MaxLength(512)
  refreshToken!: string;
}