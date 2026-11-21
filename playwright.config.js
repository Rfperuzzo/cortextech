import { defineConfig } from '@playwright/test';

const home = 'http://127.0.0.1:5190';
const integration = 'http://127.0.0.1:5191';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: home,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    launchOptions: process.env.PLAYWRIGHT_SOFTWARE_WEBGL === '1' ? {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    } : {},
    trace: 'retain-on-failure'
  },
  webServer: [
    { command: 'npm run dev -- --port 5190', url: home, env: { VITE_BRIEFING_ENDPOINT: '' } },
    { command: 'npm run dev -- --port 5191', url: integration, env: { VITE_BRIEFING_ENDPOINT: '/api/briefings' } }
  ]
});
