const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1),
  REFRESH_COOKIE_NAME: z.string().min(1),
  SHARE_TOKEN_SECRET: z.string().min(16),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

module.exports = {
  env: parsedEnv.data,
};
