import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

/**
 * Credentials are read lazily (getters) so commands like `playwright test --list`
 * work without a .env, and the values are never stored in module-level constants.
 */
export const env = {
  baseURL: process.env.BASE_URL ?? 'https://base-application-stage.oomnieye.com',
  get username(): string {
    return required('OOMNI_USERNAME');
  },
  get password(): string {
    return required('OOMNI_PASSWORD');
  },
};
