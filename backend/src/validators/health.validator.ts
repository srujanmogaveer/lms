import { z } from 'zod';

export const healthEchoSchema = {
  query: z.object({
    echo: z.string().optional(),
  }),
};
