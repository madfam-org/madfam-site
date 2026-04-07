/**
 * Seed-only password utilities.
 *
 * These helpers exist exclusively for `prisma/seed.ts` to hash
 * passwords for the initial dev/staging seed data.  They are NOT
 * used in production authentication flows — production auth is
 * handled by the Janua identity platform (external IdP).
 *
 * Security note: verifyPassword is exported for potential seed
 * verification/testing but has no production consumers.
 *
 * @see prisma/seed.ts
 */
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
