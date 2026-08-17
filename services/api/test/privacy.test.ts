import { describe, expect, it, vi } from "vitest";
import { canViewPost, getFriendIds, isBlockedBetween } from "../src/services/privacy.js";

describe("privacy service", () => {
  it("collects accepted friend ids from both sides", async () => {
    const prisma = {
      friendship: {
        findMany: vi.fn().mockResolvedValue([
          { requesterId: "me", receiverId: "a" },
          { requesterId: "b", receiverId: "me" }
        ])
      }
    } as any;

    await expect(getFriendIds(prisma, "me")).resolves.toEqual(["a", "b"]);
  });

  it("allows owners and public posts", async () => {
    const prisma = { friendship: { findMany: vi.fn() } } as any;
    await expect(canViewPost(prisma, "me", { userId: "me", privacy: "FRIENDS", deletedAt: null })).resolves.toBe(true);
    await expect(canViewPost(prisma, "me", { userId: "other", privacy: "PUBLIC", deletedAt: null })).resolves.toBe(true);
  });

  it("rejects deleted posts and non-friend private posts", async () => {
    const prisma = { friendship: { findMany: vi.fn().mockResolvedValue([]) } } as any;
    await expect(canViewPost(prisma, "me", { userId: "other", privacy: "FRIENDS", deletedAt: null })).resolves.toBe(false);
    await expect(canViewPost(prisma, "me", { userId: "me", privacy: "PUBLIC", deletedAt: new Date() })).resolves.toBe(false);
  });

  it("detects blocks in either direction", async () => {
    const prisma = { friendship: { findFirst: vi.fn().mockResolvedValue({ id: "block" }) } } as any;
    await expect(isBlockedBetween(prisma, "a", "b")).resolves.toBe(true);
  });
});
