const { z } = require("zod");

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(255, "Title must be 255 characters or fewer.");

const createDocumentSchema = z.object({
  body: z
    .object({
      title: titleSchema.optional(),
    })
    .optional(),
});

const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: titleSchema,
  }),
});

const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

module.exports = {
  createDocumentSchema,
  updateDocumentSchema,
  deleteDocumentSchema,
};
