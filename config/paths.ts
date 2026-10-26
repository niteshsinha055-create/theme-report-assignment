import path from 'path';

/** Saved cookies + localStorage, produced by tests/auth.setup.ts (git-ignored). */
export const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');
/** Saved login session from sessionStorage (storageState does not capture sessionStorage). */
export const SESSION_FILE = path.join(__dirname, '..', '.auth', 'session.json');
