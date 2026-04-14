const express = require("express");
const { authenticateAccessToken } = require("../../middleware/authenticate");
const { validate } = require("../../middleware/validate");
const {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  listDocumentsController,
  updateDocumentController,
} = require("./controller");
const {
  createDocumentSchema,
  deleteDocumentSchema,
  getDocumentSchema,
  updateDocumentSchema,
} = require("./validation");

const router = express.Router();

router.use(authenticateAccessToken);
router.get("/", listDocumentsController);
router.get("/:id", validate(getDocumentSchema), getDocumentController);
router.post("/", validate(createDocumentSchema), createDocumentController);
router.patch("/:id", validate(updateDocumentSchema), updateDocumentController);
router.delete("/:id", validate(deleteDocumentSchema), deleteDocumentController);

module.exports = {
  documentsRouter: router,
};
