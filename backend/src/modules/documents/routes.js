const express = require("express");
const { authenticateAccessToken } = require("../../middleware/authenticate");
const { validate } = require("../../middleware/validate");
const {
  createShareLinkController,
  createDocumentController,
  deleteDocumentController,
  expireShareLinkController,
  getDocumentController,
  getSharedDocumentController,
  listDocumentsController,
  updateDocumentController,
} = require("./controller");
const {
  createShareLinkSchema,
  createDocumentSchema,
  expireShareLinkSchema,
  deleteDocumentSchema,
  getDocumentSchema,
  getSharedDocumentSchema,
  updateDocumentSchema,
} = require("./validation");

const router = express.Router();

router.get(
  "/shared/:token",
  validate(getSharedDocumentSchema),
  getSharedDocumentController,
);

router.use(authenticateAccessToken);
router.get("/", listDocumentsController);
router.get("/:id", validate(getDocumentSchema), getDocumentController);
router.post("/", validate(createDocumentSchema), createDocumentController);
router.patch("/:id", validate(updateDocumentSchema), updateDocumentController);
router.post("/:id/share", validate(createShareLinkSchema), createShareLinkController);
router.delete("/:id/share", validate(expireShareLinkSchema), expireShareLinkController);
router.delete("/:id", validate(deleteDocumentSchema), deleteDocumentController);

module.exports = {
  documentsRouter: router,
};
