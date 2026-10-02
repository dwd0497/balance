/** Внутренняя read-модель для проверки пароля. Никогда не отдаётся через HTTP. */
export interface UserCredentials {
  id: string;
  passwordHash: string;
  isActive: boolean;
}
