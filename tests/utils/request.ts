import type { Page } from "@playwright/test";

export function trackPostRequest(page: Page, path: string): () => number {
  let requestcnt = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === path
    ) {
      requestcnt += 1;
    }
  });
  return () => requestcnt;
}
