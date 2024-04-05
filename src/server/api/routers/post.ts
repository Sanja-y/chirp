import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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

  create: publicProcedure
    .input(z.object({ name: z.string().min(1), id: z.number(), createdAt: z.date(), updatedAt: z.date(), content: z.string().max(255), authorID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          name: input.name,
          id: input.id,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
          content: input.content,
          authorID: input.authorID,
        },
      });
    }),

  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorID),
      limit: 100,
    })).map(filterUserForClient);

    console.log(users);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorID);
      if(!author || !author.username) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found"
      })

      return {
        post,
        author:{
          ...author,
          username: author.username,
        }
      }
    });
  })
});
