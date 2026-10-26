import { Locator, Page } from '@playwright/test';
import { APP } from '../config/app.config';

export class LoginPage {
  readonly path = APP.routes.login;

  constructor(readonly page: Page) {}

  get username(): Locator {
    return this.page.getByRole('textbox', { name: 'Email address' });
  }

  get password(): Locator {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get submit(): Locator {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  /** Never log or attach these values. Callers must run with trace/screenshot/video off. */
  async login(username: string, password: string): Promise<void> {
    if (!APP.urlPatterns.login.test(this.page.url())) await this.page.goto(this.path);
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
