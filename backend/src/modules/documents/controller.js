const { HTTP_STATUS } = require("../../utils/http-status");
const {
  createShareLink,
  createNewDocument,
  expireShareLink,
  getDocumentById,
  getDocumentByShareToken,
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

async function getSharedDocumentController(req, res) {
  const document = await getDocumentByShareToken(req.validated.params.token);

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

async function createShareLinkController(req, res) {
  const share = await createShareLink(req.auth.userId, req.validated.params.id);

  res.status(HTTP_STATUS.OK).json({
    share,
  });
}

async function expireShareLinkController(req, res) {
  const share = await expireShareLink(req.auth.userId, req.validated.params.id);

  res.status(HTTP_STATUS.OK).json({
    share,
  });
}

async function deleteDocumentController(req, res) {
  const result = await removeDocument(req.auth.userId, req.validated.params.id);

  res.status(HTTP_STATUS.OK).json(result);
}

module.exports = {
  listDocumentsController,
  getDocumentController,
  getSharedDocumentController,
  createDocumentController,
  updateDocumentController,
  createShareLinkController,
  expireShareLinkController,
  deleteDocumentController,
};
