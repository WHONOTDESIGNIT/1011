import { defineCollection, z } from 'astro:content';

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    authorAvatar: z.string().optional(),
    editor: z.string().optional(),
    category: z.string(),
    heroImage: z.string().optional(),
    ogImage: z.string().optional(),
    slug: z.string().optional(),
    translationKey: z.string(),
    url: z.string().optional(),
    primary_keyword: z.string().optional(),
    secondary_keywords: z.array(z.string()).optional(),
    readTime: z.union([z.string(), z.number()]).optional(),
    draft: z.boolean().optional(),
    faqs: z.array(faqItemSchema).optional(),
  }),
});

export const collections = { blog };
