const { z } = require("zod");

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(255, "Title must be 255 characters or fewer.");

const blockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "paragraph",
    "heading_1",
    "heading_2",
    "todo",
    "code",
    "divider",
    "image",
  ]),
  content: z.any(),
  orderIndex: z.number().nonnegative(),
  parentId: z.string().uuid().nullable().optional(),
});

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
    title: titleSchema.optional(),
    blocks: z.array(blockSchema).optional(),
  }),
});

const getDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
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
  getDocumentSchema,
  deleteDocumentSchema,
};
