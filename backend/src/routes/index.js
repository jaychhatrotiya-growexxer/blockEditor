const express = require("express");
const { healthRouter } = require("./health.routes");
const { authRouter } = require("../modules/auth/routes");
const { documentsRouter } = require("../modules/documents/routes");

const apiRouter = express.Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/documents", documentsRouter);

module.exports = {
  apiRouter,
};
