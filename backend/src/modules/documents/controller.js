const { HTTP_STATUS } = require("../../utils/http-status");
const { createNewDocument, getDocuments, removeDocument, renameDocument } = require("./service");

async function listDocumentsController(req, res) {
  const documents = await getDocuments(req.auth.userId);

  res.status(HTTP_STATUS.OK).json({
    documents,
  });
}

async function createDocumentController(req, res) {
  const document = await createNewDocument(req.auth.userId, req.validated.body || {});

  res.status(HTTP_STATUS.CREATED).json({
    document,
  });
}

async function updateDocumentController(req, res) {
  const document = await renameDocument(req.auth.userId, req.validated.params.id, req.validated.body);

  res.status(HTTP_STATUS.OK).json({
    document,
  });
}

async function deleteDocumentController(req, res) {
  const result = await removeDocument(req.auth.userId, req.validated.params.id);

  res.status(HTTP_STATUS.OK).json(result);
}

module.exports = {
  listDocumentsController,
  createDocumentController,
  updateDocumentController,
  deleteDocumentController,
};
