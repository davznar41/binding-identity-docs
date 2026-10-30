import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/docs',
    generateId: ({ data }) => z.string().min(1).parse(data.id),
  }),
  schema: z.object({
    title: z.string().min(1),
    example: z.string().optional(),
  }),
});

export const collections = { docs };
