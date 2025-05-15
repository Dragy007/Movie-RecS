
'use server';
/**
 * @fileOverview A Genkit flow to generate a movie poster image based on a description.
 *
 * - generateMoviePosterImage - A function that generates a movie poster.
 * - GenerateMoviePosterImageInput - The input type for the generateMoviePosterImage function.
 * - GenerateMoviePosterImageOutput - The return type for the generateMoviePosterImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMoviePosterImageInputSchema = z.object({
  posterDescription: z
    .string()
    .describe('A textual description of the movie poster to be generated.'),
  movieTitle: z.string().describe('The title of the movie, to potentially include as text on the poster.')
});
export type GenerateMoviePosterImageInput = z.infer<typeof GenerateMoviePosterImageInputSchema>;

const GenerateMoviePosterImageOutputSchema = z.object({
  posterDataUri: z
    .string()
    .describe("The generated movie poster image as a data URI (e.g., 'data:image/png;base64,...')."),
});
export type GenerateMoviePosterImageOutput = z.infer<typeof GenerateMoviePosterImageOutputSchema>;

export async function generateMoviePosterImage(input: GenerateMoviePosterImageInput): Promise<GenerateMoviePosterImageOutput> {
  return generateMoviePosterImageFlow(input);
}

const generateMoviePosterImageFlow = ai.defineFlow(
  {
    name: 'generateMoviePosterImageFlow',
    inputSchema: GenerateMoviePosterImageInputSchema,
    outputSchema: GenerateMoviePosterImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use the specified model for image generation
      prompt: `Generate a movie poster based on this description: "${input.posterDescription}". The movie title is "${input.movieTitle}". If possible, subtly incorporate the movie title text into the poster design. The style should be cinematic and visually appealing.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include IMAGE for generation
        // You can adjust safety settings if needed, but default is usually fine for posters
      },
    });

    if (media && media.url) {
      return { posterDataUri: media.url };
    } else {
      // Fallback or error handling if image generation fails
      // For now, returning a placeholder data URI or throwing an error
      console.error('Image generation failed or media.url is undefined.');
      // Return a very simple placeholder if generation fails.
      return { posterDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }; // 1x1 transparent pixel
    }
  }
);
