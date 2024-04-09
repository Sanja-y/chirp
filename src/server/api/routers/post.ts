import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
  };
}


export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1), id: z.number(), createdAt: z.date(), updatedAt: z.date(), content: z.string().max(255), authorID: z.string() }))
  //   .mutation(async ({ ctx, input }) => {
  //     // simulate a slow db call
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return ctx.db.post.create({
  //       data: {
  //         name: input.name,
  //         id: input.id,
  //         createdAt: input.createdAt,
  //         updatedAt: input.updatedAt,
  //         content: input.content,
  //         authorID: input.authorID,
  //       },
  //     });
  //   }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: [
        { createdAt: "desc" }
      ]
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorID),
      limit: 100,
    })).map(filterUserForClient);

    // console.log(users);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorID);
      if (!author || !author.username) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found"
      })

      return {
        post,
        author: {
          ...author,
          username: author.username,
        }
      }
    });
  }),
  create: privateProcedure.input(
    z.object(
      {
        content: z.string().emoji().min(1).max(200),
        name: z.string(),
      }
    )
  ).mutation(async ({ ctx, input }) => {
    const rateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      analytics: true,
    });

    const authorID = String(ctx.currentUserID);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { success } = await rateLimit.limit(authorID);

    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

    const post = ctx.db.post.create({
      data: {
        authorID,
        name: input.name,
        content: input.content,
      },
    });
    return post;
  }),
});
