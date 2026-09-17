import { mkdirSync, writeFileSync } from "node:fs";
import { appendFile } from "node:fs/promises";
import path from "node:path";

const logDir = path.resolve("mock-server", "logs");
const logPath = path.join(logDir, "server.log");

export function createServerLogger() {
  mkdirSync(logDir, { recursive: true });
  writeFileSync(logPath, "", "utf8");

  return (req, res, next) => {
    const startAt = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - startAt;
      const entry = [
        `[${new Date().toISOString()}] SERVER`,
        `method: ${req.method}`,
        `url: ${req.originalUrl}`,
        `status: ${res.statusCode}`,
        `duration: ${duration}ms`,
        "",
      ].join("\n");
      console.info(entry);
      appendFile(logPath, entry, "utf8").catch((error) => {
        console.error("Unable to write server log:", error);
      });
    });
    next();
  };
}
