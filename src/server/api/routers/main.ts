import { z } from "zod";

import { createTRPCRouter, securedProcedure } from "~/server/api/trpc";

export const mainRouter = createTRPCRouter({
  hello: securedProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`
      };
    })
});
