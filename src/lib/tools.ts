import { z } from 'zod';

// --- Weather Tool (MOCK) ---
export const weatherTool = {
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
  }),
  execute: async ({ location }: { location: string }) => {
    // Mock response
    console.log(`[Mock Tool] Fetching weather for ${location}`);
    return {
      location: location,
      temperature: 22,
      condition: 'Sunny (Mock Data)',
      humidity: 45,
      note: "This is mock data because external APIs are disabled."
    };
  },
};

// --- Recipe Tool (MOCK) ---
export const recipeTool = {
  description: 'Search for recipes based on ingredients or query',
  parameters: z.object({
    query: z.string().describe('The food query, e.g. pasta, chicken parm'),
  }),
  execute: async ({ query }: { query: string }) => {
    // Mock response
    console.log(`[Mock Tool] Fetching recipes for ${query}`);
    return {
      recipes: [
        {
          label: `${query} Special (Mock)`,
          url: '#',
          ingredients: ['Ingredient 1', 'Ingredient 2', 'Love'],
          calories: 500,
          image: 'https://placehold.co/600x400?text=Recipe+Image',
        },
        {
          label: `Classic ${query} (Mock)`,
          url: '#',
          ingredients: ['Ingredient A', 'Ingredient B'],
          calories: 750,
          image: 'https://placehold.co/600x400?text=Recipe+Image',
        }
      ],
      note: "This is mock data because external APIs are disabled."
    };
  },
};

// --- Currency Tool (MOCK) ---
export const currencyTool = {
  description: 'Convert currency from one code to another',
  parameters: z.object({
    from: z.string().describe('Base currency code, e.g. USD'),
    to: z.string().describe('Target currency code, e.g. EUR'),
    amount: z.number().optional().default(1).describe('Amount to convert'),
  }),
  execute: async ({ from, to, amount }: { from: string; to: string; amount: number }) => {
    // Mock response
    console.log(`[Mock Tool] Converting ${amount} ${from} to ${to}`);
    return {
      from,
      to,
      amount,
      result: amount * 1.1, // Fixed mock rate
      rate: 1.1,
      note: "This is mock data because external APIs are disabled."
    };
  },
};
