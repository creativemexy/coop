import {
  IsBoolean,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;

  /** Explicit consent that the sender's details may be used for this enquiry. */
  @IsBoolean()
  consent: boolean;
}
