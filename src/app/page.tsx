
'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeMoviePreferences, type AnalyzeMoviePreferencesInput } from '@/ai/flows/analyze-movie-preferences';
import { generatePersonalizedRecommendations, type GeneratePersonalizedRecommendationsInput, type GeneratePersonalizedRecommendationsOutput } from '@/ai/flows/generate-personalized-recommendations';
import { generateMoviePosterImage, type GenerateMoviePosterImageInput } from '@/ai/flows/generate-movie-poster-image';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

import AppHeader from '@/components/layout/app-header';
import MovieRatingForm from '@/components/movie/movie-rating-form';
import RatedMoviesList from '@/components/movie/rated-movies-list';
import RecommendationsDisplay from '@/components/movie/recommendations-display';
import { Loader2, Wand2, Film, Search, AlertCircle, User, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export interface RatedMovie {
  id: string;
  title: string;
  rating: number;
  posterDataUri: string; // Can be a URL from TMDB, placeholder, or base64 data URI from AI
  summary: string;
  createdAt?: Timestamp;
}

export interface RecommendedMovie {
  title: string;
  posterDataUri: string; // Typically a base64 data URI from AI
  summary: string;
}

interface MockMovieData {
  title: string;
  poster_path: string;
  overview: string;
}

const Home: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [analyzedMovieTypes, setAnalyzedMovieTypes] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);
  const [mockMovieData, setMockMovieData] = useState<MockMovieData[]>([]);

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingRatedMovies, setIsLoadingRatedMovies] = useState(true);
  const [isRatingMovie, setIsRatingMovie] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
    // Fetch mock movie data
    fetch('/mock-movie-data.json')
      .then(res => res.json())
      .then(data => setMockMovieData(data))
      .catch(err => console.error("Failed to load mock movie data:", err));
  }, []);

  const { toast } = useToast();

  useEffect(() => {
    if (!clientLoaded || authLoading) return;

    if (user) {
      setIsLoadingRatedMovies(true);
      const ratedMoviesCol = collection(db, `users/${user.uid}/ratedMovies`);
      const q = query(ratedMoviesCol, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const movies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RatedMovie));
        setRatedMovies(movies);
        setIsLoadingRatedMovies(false);
        setAnalyzedMovieTypes(null);
        setRecommendations([]);
      }, (error) => {
        console.error("Error fetching rated movies: ", error);
        toast({ title: 'Error', description: 'Could not fetch your rated movies.', variant: 'destructive' });
        setIsLoadingRatedMovies(false);
      });
      return () => unsubscribe();
    } else {
      setRatedMovies([]);
      setAnalyzedMovieTypes(null);
      setRecommendations([]);
      setIsLoadingRatedMovies(false);
    }
  }, [user, authLoading, clientLoaded, toast]);


  const handleMovieRated = async (movieRatingInput: { title: string, rating: number }) => {
    if (!clientLoaded || !user) {
      toast({ title: 'Login Required', description: 'Please log in to rate movies.', variant: 'destructive'});
      return;
    }
    setIsRatingMovie(true);
    let posterUrl = `https://placehold.co/300x450.png`;
    let movieSummary = "Your rating has been recorded. (Details not found in local mock data)";
    
    const foundMockMovie = mockMovieData.find(m => m.title.toLowerCase() === movieRatingInput.title.toLowerCase());

    if (foundMockMovie && foundMockMovie.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w500${foundMockMovie.poster_path}`;
      movieSummary = foundMockMovie.overview || "Overview not available.";
      toast({ title: 'Movie Details Found!', description: `Using details for "${movieRatingInput.title}" from mock dataset.`});
    } else {
       toast({ title: 'Using Placeholder', description: `Details for "${movieRatingInput.title}" not in mock dataset. Using placeholder.`});
    }

    try {
      const ratedMoviesCol = collection(db, `users/${user.uid}/ratedMovies`);
      await addDoc(ratedMoviesCol, {
        title: movieRatingInput.title,
        rating: movieRatingInput.rating,
        summary: movieSummary,
        posterDataUri: posterUrl, 
        createdAt: Timestamp.now(),
      });
      toast({ title: 'Movie Rated!', description: `"${movieRatingInput.title}" added to your list.` });
    } catch (error) {
      console.error("Error saving rated movie: ", error);
      toast({ title: 'Rating Failed', description: 'Could not save your rating. Please try again.', variant: 'destructive' });
    } finally {
      setIsRatingMovie(false);
    }
  };

  const handleAnalyzePreferences = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please log in to analyze preferences.', variant: 'destructive'});
      return;
    }
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
      toast({ title: 'Analyzing Preferences...', description: 'AI is learning your movie tastes.' });
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
    if (!user) {
      toast({ title: 'Login Required', description: 'Please log in to get recommendations.', variant: 'destructive'});
      return;
    }
    if (!analyzedMovieTypes) {
      toast({ title: 'Analysis Needed', description: 'Please analyze your preferences first before getting recommendations.', variant: 'destructive' });
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendations([]);
    toast({ title: 'Fetching Recommendations...', description: 'AI is picking out some movies for you.' });

    try {
      const input: GeneratePersonalizedRecommendationsInput = { movieTypes: analyzedMovieTypes };
      const result: GeneratePersonalizedRecommendationsOutput = await generatePersonalizedRecommendations(input);

      toast({ title: 'Generating Recommendation Posters...', description: 'AI is creating unique posters for your recommendations. This may take a moment.', duration: 10000 });

      const recommendedMoviesWithPosters: RecommendedMovie[] = await Promise.all(
        result.recommendations.map(async (rec) => {
          try {
            const posterImageInput: GenerateMoviePosterImageInput = { movieTitle: rec.title, posterDescription: rec.posterDescription };
            const posterImage = await generateMoviePosterImage(posterImageInput);
            return {
              title: rec.title,
              summary: rec.summary,
              posterDataUri: posterImage.posterDataUri,
            };
          } catch (imgError) {
            console.error(`Error generating poster for ${rec.title}:`, imgError);
            return { 
              title: rec.title,
              summary: rec.summary,
              posterDataUri: 'https://placehold.co/300x450.png?text=Error+Generating+Image', 
            };
          }
        })
      );

      setRecommendations(recommendedMoviesWithPosters);
      toast({ title: 'Recommendations Ready!', description: 'Check out your personalized list of movies with AI-generated posters below.' });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({ title: 'Recommendation Failed', description: 'Could not generate recommendations at this time. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  if (!clientLoaded || authLoading) {
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

        {!user && (
          <Alert variant="default" className="border-primary/50 bg-primary/10">
            <User className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Welcome to Movie Recs!</AlertTitle>
            <AlertDescription className="text-foreground/80">
              Please <Link href="/login" className="font-semibold text-accent hover:underline">log in</Link> or <Link href="/signup" className="font-semibold text-accent hover:underline">sign up</Link> to rate movies and get personalized recommendations.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Search className="h-7 w-7 mr-3" /> Rate Your Movies
            </CardTitle>
            <CardDescription>Tell us about movies you&apos;ve seen. Your rated movies will be saved to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <MovieRatingForm onMovieRated={handleMovieRated} disabled={isRatingMovie} />
            ) : (
              <div className="text-center p-6 bg-muted/30 rounded-md">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  You need to be logged in to rate movies.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/login">Login to Rate</Link>
                </Button>
              </div>
            )}
             {isRatingMovie && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Adding movie to your list...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {(user && (isLoadingRatedMovies || ratedMovies.length > 0)) && (
          <>
            <Separator className="my-8" />
            {isLoadingRatedMovies ? (
               <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-4" />
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {Array.from({length: 3}).map((_, i) => (
                      <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
               </div>
            ) : (
              <RatedMoviesList movies={ratedMovies} />
            )}

            {ratedMovies.length > 0 && (
              <div className="text-center mt-8">
                <Button onClick={handleAnalyzePreferences} disabled={isLoadingAnalysis || !user || isRatingMovie} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md">
                  {isLoadingAnalysis ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  Analyze My Preferences
                </Button>
                {analyzedMovieTypes && !isLoadingAnalysis && (
                  <p className="mt-6 text-md sm:text-lg text-muted-foreground animate-in fade-in duration-500">
                    <span className="font-semibold text-foreground">We think you like:</span> <span className="text-primary font-medium">{analyzedMovieTypes}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {user && analyzedMovieTypes && (
          <>
            <Separator className="my-8" />
            <div className="text-center mt-8">
               <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !user || isRatingMovie} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md">
                {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Film className="mr-2 h-5 w-5" />}
                Get AI Recommendations
              </Button>
            </div>
          </>
        )}

        {user && (isLoadingRecommendations || recommendations.length > 0) && (
          <>
            <Separator className="my-8" />
            <section id="recommendations-section" className="animate-in fade-in duration-700">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary flex items-center">
                <ImageIcon className="h-7 w-7 mr-3 text-accent" /> AI-Generated Movie Picks!
              </h2>
              <p className="mb-6 text-muted-foreground">Each movie comes with an AI-generated summary and a unique, AI-created poster.</p>
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
