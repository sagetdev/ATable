import app from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log("");
  console.log("==================================");
  console.log("       À TABLE API");
  console.log("==================================");
  console.log(`Environnement : ${env.NODE_ENV}`);
  console.log(`Port          : ${env.PORT}`);
  console.log(`Santé API     : http://localhost:${env.PORT}/api/v1/health`);
  console.log("==================================");
  console.log("");
});

function shutdown(signal: string) {
  console.log(`Arrêt demandé : ${signal}`);

  server.close((error) => {
    if (error) {
      console.error("Erreur pendant l'arrêt :", error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
