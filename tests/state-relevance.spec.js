// @ts-check
import { test, expect } from "@playwright/test";

/** @type {string} */
const NEWS_API_KEY = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY || "";
const HAS_NEWS_API_KEY = NEWS_API_KEY.length > 0;

test.describe("state relevance filtering", () => {
  test.skip(!HAS_NEWS_API_KEY, "Set NEWS_API_KEY (or NEWSAPI_KEY) to run state relevance API tests.");

  ["print", "video", "mix"].forEach((format) => {
    test(`returns ${format.toUpperCase()} stories that match Arizona`, async ({ request }) => {
      const headers = /** @type {Record<string, string>} */ ({
        "x-api-key": NEWS_API_KEY
      });

      const response = await request.get(`http://localhost:5500/api/news?state=Arizona&format=${format}`, {
        headers
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(Array.isArray(body.articles)).toBeTruthy();

      for (const article of body.articles) {
        expect(article.stateMatch).toBeTruthy();
        expect(article.mediaFormat === "PRINT" || article.mediaFormat === "VIDEO").toBeTruthy();
      }
    });
  });
});
