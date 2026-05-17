import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV,
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT!, 10),
  url: process.env.APP_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES,
  },
  ai: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL,
    openRouterModel: process.env.OPENROUTER_MODEL,
  },
}));
