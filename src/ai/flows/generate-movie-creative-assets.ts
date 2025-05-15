
'use server';
/**
 * @fileOverview A Genkit flow to generate a movie summary and a description for its poster.
 *
 * - generateMovieCreativeAssets - A function that generates creative assets for a movie.
 * - GenerateMovieCreativeAssetsInput - The input type for the generateMovieCreativeAssets function.
 * - GenerateMovieCreativeAssetsOutput - The return type for the generateMovieCreativeAssets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMovieCreativeAssetsInputSchema = z.object({
  movieTitle: z.string().describe('The title of the movie.'),
});
export type GenerateMovieCreativeAssetsInput = z.infer<typeof GenerateMovieCreativeAssetsInputSchema>;

const GenerateMovieCreativeAssetsOutputSchema = z.object({
  summary: z.string().describe('A short, engaging summary of the movie (around 2-3 sentences).'),
  posterDescription: z
    .string()
    .describe(
      'A brief textual description (1-2 sentences) of a visually appealing movie poster concept for the given movie title. This description will be used to generate an image.'
    ),
});
export type GenerateMovieCreativeAssetsOutput = z.infer<typeof GenerateMovieCreativeAssetsOutputSchema>;

export async function generateMovieCreativeAssets(input: GenerateMovieCreativeAssetsInput): Promise<GenerateMovieCreativeAssetsOutput> {
  return generateMovieCreativeAssetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMovieCreativeAssetsPrompt',
  input: {schema: GenerateMovieCreativeAssetsInputSchema},
  output: {schema: GenerateMovieCreativeAssetsOutputSchema},
  prompt: `You are a creative assistant for a movie database.
For the movie titled "{{movieTitle}}":
1. Generate a concise and engaging summary (2-3 sentences).
2. Generate a brief textual description (1-2 sentences) for a visually appealing movie poster concept. This description should guide an AI image generator. Focus on mood, key elements, and style. For example: "A vibrant, action-packed poster for a superhero film, showcasing the hero mid-flight against a cityscape." or "A minimalist, thought-provoking poster for a drama, featuring a single, symbolic object against a stark background."
`,
});

const generateMovieCreativeAssetsFlow = ai.defineFlow(
  {
    name: 'generateMovieCreativeAssetsFlow',
    inputSchema: GenerateMovieCreativeAssetsInputSchema,
    outputSchema: GenerateMovieCreativeAssetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
