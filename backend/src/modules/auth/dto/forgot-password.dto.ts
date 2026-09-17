import { IsString, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  /**
   * Email or phone number — members may register with either identifier.
   */
  @IsString()
  @IsNotEmpty({ message: 'Email or phone number is required' })
  emailOrPhone: string;
}
