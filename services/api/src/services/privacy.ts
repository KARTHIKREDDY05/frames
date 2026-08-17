import type { Post, PrismaClient } from "@prisma/client";

export async function getFriendIds(prisma: PrismaClient, userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { receiverId: userId }]
    },
    select: { requesterId: true, receiverId: true }
  });

  return friendships.map((friendship) => (friendship.requesterId === userId ? friendship.receiverId : friendship.requesterId));
}

export async function canViewPost(prisma: PrismaClient, viewerId: string, post: Pick<Post, "userId" | "privacy" | "deletedAt">) {
  if (post.deletedAt) return false;
  if (post.userId === viewerId) return true;
  if (post.privacy === "PUBLIC") return true;
  const friendIds = await getFriendIds(prisma, viewerId);
  return friendIds.includes(post.userId);
}

export async function isBlockedBetween(prisma: PrismaClient, a: string, b: string) {
  const blocked = await prisma.friendship.findFirst({
    where: {
      status: "BLOCKED",
      OR: [
        { requesterId: a, receiverId: b },
        { requesterId: b, receiverId: a }
      ]
    },
    select: { id: true }
  });
  return Boolean(blocked);
}
