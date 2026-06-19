import { describe, expect, it } from "vitest";

describe("Kakao Map API Key", () => {
  it("should have VITE_KAKAO_MAP_KEY environment variable set", () => {
    const apiKey = process.env.VITE_KAKAO_MAP_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBe("fe839ac372b14b45bde067949bcfb03f");
  });

  it("should validate API key format", () => {
    const apiKey = process.env.VITE_KAKAO_MAP_KEY;
    expect(apiKey).toMatch(/^[a-f0-9]{32}$/);
  });
});
