import * as Joi from 'joi';

/**
 * Configuration validation schema using Joi.
 * This schema validates environment variables for the application.
 */
export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  APP_NAME: Joi.string().required(),
  APP_URL: Joi.string().uri().required(),
  APP_PORT: Joi.number().default(5000),

  DB_TYPE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES: Joi.string().required(),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_USERNAME: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),
  ADMIN_FULL_NAME: Joi.string().required(),

  CURATOR_EMAIL: Joi.string().email().required(),
  CURATOR_USERNAME: Joi.string().required(),
  CURATOR_PASSWORD: Joi.string().required(),
  CURATOR_FULL_NAME: Joi.string().required(),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().port().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM_NAME: Joi.string().default('YourApp'),
  MAIL_FROM_EMAIL: Joi.string().email().required(),

  TYPEORM_LOGGING: Joi.boolean().default(false),

  OPENROUTER_API_KEY: Joi.string().required(),
  OPENROUTER_BASE_URL: Joi.string().uri().required(),
  OPENROUTER_MODEL: Joi.string().required(),
});
