import { describe, expect, it } from "vitest";
import { calculateHighlightScore } from "../src/jobs/highlightScoring.js";

describe("calculateHighlightScore", () => {
  it("weights engagement and mock AI signals deterministically", () => {
    const score = calculateHighlightScore({
      likes: 10,
      comments: 2,
      visualQualityScore: 0.8,
      faceScore: 0.4,
      sentimentScore: 0.7,
      eventScore: 0.5,
      uniquenessScore: 0.9
    });

    expect(score).toBe(0.665);
  });
});
