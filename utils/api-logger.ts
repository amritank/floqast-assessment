import { appendFile } from "fs/promises";
import type { APIResponse } from "@playwright/test";

type ApiRequest = {
  method: string;
  url: string;
  body?: unknown;
};

type ApiResponse = {
  res: APIResponse;
  body?: unknown;
};

export async function logApiRequest(
  filepath: string,
  { method, url, body }: ApiRequest,
): Promise<void> {
  const entry = [
    `[${new Date().toISOString()}] REQUEST:`,
    `method: ${method}`,
    `url: ${url}`,
    `body: ${JSON.stringify(body ?? null)}`,
    "",
  ].join("\n");
  console.log(entry);
  await appendFile(filepath, entry, "utf8");
}

export async function logApiResponse(
  filepath: string,
  { res, body }: ApiResponse,
): Promise<void> {
  const entry = [
    `[${new Date().toISOString()}] RESPONSE`,
    `url: ${res.url()}`,
    `status: ${res.status()} ${res.statusText()}`,
    `body: ${JSON.stringify(body ?? null)}`,
    "",
  ].join("\n");
  console.log(entry);
  await appendFile(filepath, entry, "utf8");
}
