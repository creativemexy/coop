import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  ValidateIf,
} from 'class-validator'

export class RegisterDto {
  @ValidateIf(() => true)
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, { message: 'Password must contain at least one special character' })
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  organizationCode?: string
}