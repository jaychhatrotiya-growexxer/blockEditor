const { z } = require("zod");

const emailSchema = z.string().trim().email().max(255).transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/\d/, "Password must contain at least one number.");

const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required."),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
