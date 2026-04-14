const { HTTP_STATUS } = require("../../utils/http-status");
const {
  createNewDocument,
  getDocumentById,
  getDocuments,
  removeDocument,
  saveDocument,
} = require("./service");

async function listDocumentsController(req, res) {
  const documents = await getDocuments(req.auth.userId);

  res.status(HTTP_STATUS.OK).json({
    documents,
  });
}

async function getDocumentController(req, res) {
  const document = await getDocumentById(
    req.auth.userId,
    req.validated.params.id,
  );

  res.status(HTTP_STATUS.OK).json({
    document,
  });
}

async function createDocumentController(req, res) {
  const document = await createNewDocument(
    req.auth.userId,
    req.validated.body || {},
  );

  res.status(HTTP_STATUS.CREATED).json({
    document,
  });
}

async function updateDocumentController(req, res) {
  const document = await saveDocument(
    req.auth.userId,
    req.validated.params.id,
    req.validated.body,
  );

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
  getDocumentController,
  createDocumentController,
  updateDocumentController,
  deleteDocumentController,
};
