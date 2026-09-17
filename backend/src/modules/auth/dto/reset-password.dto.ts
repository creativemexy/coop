import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Email or phone number is required' })
  emailOrPhone: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\x5b\]{};':"\\|,.<>\x2f?`~])/, {
    message: 'Password must contain at least one special character',
  })
  newPassword: string;
}
