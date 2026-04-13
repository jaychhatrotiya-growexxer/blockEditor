const { env } = require("./config/env");
const { app } = require("./app");

const server = app.listen(env.PORT, () => {
  console.log(`Backend server listening on http://localhost:${env.PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close server cleanly.", error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
