import { describe, expect, it } from "vitest";
import { renderDailyFrameHtml } from "../src/index.js";

describe("renderDailyFrameHtml", () => {
  it("renders deterministic scrapbook markup", () => {
    const html = renderDailyFrameHtml({ title: "August 16, 2026", subtitle: "A Sunday worth remembering.", posts: [] });
    expect(html).toContain("August 16, 2026");
    expect(html).toContain("page");
  });
});
