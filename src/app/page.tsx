'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeMoviePreferences, type AnalyzeMoviePreferencesInput } from '@/ai/flows/analyze-movie-preferences';
import { generatePersonalizedRecommendations, type GeneratePersonalizedRecommendationsInput } from '@/ai/flows/generate-personalized-recommendations';

import AppHeader from '@/components/layout/app-header';
import MovieRatingForm from '@/components/movie/movie-rating-form';
import RatedMoviesList from '@/components/movie/rated-movies-list';
import RecommendationsDisplay from '@/components/movie/recommendations-display';
import { Loader2, Wand2, Film, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


export interface RatedMovie {
  id: string; 
  title: string;
  rating: number;
  posterUrl: string;
  summary: string;
}

export interface RecommendedMovie {
  title: string;
  posterUrl: string;
  summary: string;
}

const Home: NextPage = () => {
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [analyzedMovieTypes, setAnalyzedMovieTypes] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);
  
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true); // Ensures crypto.randomUUID is available
  }, []);

  const { toast } = useToast();

  const handleMovieRated = (movie: Omit<RatedMovie, 'id'>) => {
    if (!clientLoaded) return; // Prevent execution if client hasn't loaded
    setRatedMovies((prevMovies) => [...prevMovies, { ...movie, id: crypto.randomUUID() }]);
    setAnalyzedMovieTypes(null);
    setRecommendations([]);
     toast({ title: 'Movie Rated!', description: `"${movie.title}" added to your list.` });
  };

  const handleAnalyzePreferences = async () => {
    if (ratedMovies.length === 0) {
      toast({ title: 'No movies rated', description: 'Please rate some movies first to analyze your preferences.', variant: 'destructive' });
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalyzedMovieTypes(null); 
    setRecommendations([]); 

    const ratedMoviesString = ratedMovies
      .map((movie) => `${movie.title} (Rating: ${movie.rating}/5)`)
      .join(', ');

    try {
      const input: AnalyzeMoviePreferencesInput = { ratedMovies: ratedMoviesString };
      const result = await analyzeMoviePreferences(input);
      setAnalyzedMovieTypes(result.movieTypes);
      toast({ title: 'Analysis Complete!', description: `Based on your ratings, we think you enjoy: ${result.movieTypes}` });
    } catch (error) {
      console.error('Error analyzing movie preferences:', error);
      toast({ title: 'Analysis Failed', description: 'There was an issue analyzing your movie preferences. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!analyzedMovieTypes) {
      toast({ title: 'Analysis Needed', description: 'Please analyze your preferences first before getting recommendations.', variant: 'destructive' });
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendations([]);

    try {
      const input: GeneratePersonalizedRecommendationsInput = { movieTypes: analyzedMovieTypes };
      const result = await generatePersonalizedRecommendations(input);
      
      const recommendedMoviesData: RecommendedMovie[] = result.recommendations.map(title => ({
        title,
        posterUrl: `https://placehold.co/300x450.png?text=${encodeURIComponent(title.substring(0,20))}`, 
        summary: `A highly recommended ${analyzedMovieTypes.toLowerCase().split(', ')[0] || 'movie'} for you. Explore "${title}" and discover your next favorite!`,
      }));
      setRecommendations(recommendedMoviesData);
      toast({ title: 'Recommendations Ready!', description: 'Check out your personalized list of movies below.' });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({ title: 'Recommendation Failed', description: 'Could not generate recommendations at this time. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  if (!clientLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Movie Recs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 space-y-10 md:space-y-12">
        
        <Card className="shadow-xl border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Search className="h-7 w-7 mr-3" /> Rate Your Movies
            </CardTitle>
            <CardDescription>Tell us about movies you've seen and loved (or not!). The more you rate, the better your recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <MovieRatingForm onMovieRated={handleMovieRated} />
          </CardContent>
        </Card>

        {ratedMovies.length > 0 && (
          <>
            <Separator className="my-8" />
            <RatedMoviesList movies={ratedMovies} />
            
            <div className="text-center mt-8">
              <Button onClick={handleAnalyzePreferences} disabled={isLoadingAnalysis} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md">
                {isLoadingAnalysis ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                Analyze My Preferences
              </Button>
              {analyzedMovieTypes && !isLoadingAnalysis && (
                <p className="mt-6 text-md sm:text-lg text-muted-foreground animate-in fade-in duration-500">
                  <span className="font-semibold text-foreground">We think you like:</span> <span className="text-primary font-medium">{analyzedMovieTypes}</span>
                </p>
              )}
            </div>
          </>
        )}

        {analyzedMovieTypes && (
          <>
            <Separator className="my-8" />
            <div className="text-center mt-8">
               <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md">
                {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Film className="mr-2 h-5 w-5" />}
                Get Personalized Recommendations
              </Button>
            </div>
          </>
        )}
        
        {(isLoadingRecommendations || recommendations.length > 0) && (
          <>
            <Separator className="my-8" />
            <section id="recommendations-section" className="animate-in fade-in duration-700">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary flex items-center">
                <Film className="h-7 w-7 mr-3" /> Here Are Your Picks!
              </h2>
              <RecommendationsDisplay recommendations={recommendations} loading={isLoadingRecommendations} />
            </section>
          </>
        )}
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground border-t border-border mt-12">
        Movie Recs &copy; {new Date().getFullYear()} &bull; Powered by AI
      </footer>
    </div>
  );
};

export default Home;
