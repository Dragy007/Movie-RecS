'use server';
/**
 * @fileOverview A flow that analyzes a user's movie preferences based on their rated movies.
 *
 * - analyzeMoviePreferences - A function that analyzes movie preferences and returns the determined movie types.
 * - AnalyzeMoviePreferencesInput - The input type for the analyzeMoviePreferences function.
 * - AnalyzeMoviePreferencesOutput - The return type for the analyzeMoviePreferences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMoviePreferencesInputSchema = z.object({
  ratedMovies: z
    .string()
    .describe("A list of movies the user has rated, with title and rating. Example: 'Movie Title (Rating: 5/5), Another Movie (Rating: 3/5)'"),
});
export type AnalyzeMoviePreferencesInput = z.infer<typeof AnalyzeMoviePreferencesInputSchema>;

const AnalyzeMoviePreferencesOutputSchema = z.object({
  movieTypes: z
    .string()
    .describe('A comma separated list of movie types that the user likes based on their rated movies.'),
});
export type AnalyzeMoviePreferencesOutput = z.infer<typeof AnalyzeMoviePreferencesOutputSchema>;

export async function analyzeMoviePreferences(input: AnalyzeMoviePreferencesInput): Promise<AnalyzeMoviePreferencesOutput> {
  return analyzeMoviePreferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMoviePreferencesPrompt',
  input: {schema: AnalyzeMoviePreferencesInputSchema},
  output: {schema: AnalyzeMoviePreferencesOutputSchema},
  prompt: `You are an AI movie expert. Analyze the following list of movies the user has rated and determine the types of movies they like. Return a comma separated list of movie types.

Rated Movies: {{{ratedMovies}}}`,
});

const analyzeMoviePreferencesFlow = ai.defineFlow(
  {
    name: 'analyzeMoviePreferencesFlow',
    inputSchema: AnalyzeMoviePreferencesInputSchema,
    outputSchema: AnalyzeMoviePreferencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
