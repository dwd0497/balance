import {
  ChangePasswordSchema,
  LoginSchema,
  PublicUserSchema,
  RegisterSchema,
} from '@balance/shared';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export class PublicUserDto extends createZodDto(PublicUserSchema) {}
