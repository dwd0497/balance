import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  /** Хеш-заглушка для выравнивания времени ответа, когда пользователь не найден. */
  private readonly dummyHash = argon2.hash('dummy-password-for-timing', { type: argon2.argon2id });

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async verifyDummy(password: string): Promise<void> {
    await argon2.verify(await this.dummyHash, password);
  }
}
