
'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeMoviePreferences, type AnalyzeMoviePreferencesInput } from '@/ai/flows/analyze-movie-preferences';
import { generatePersonalizedRecommendations, type GeneratePersonalizedRecommendationsInput, type GeneratePersonalizedRecommendationsOutput } from '@/ai/flows/generate-personalized-recommendations';
import { generateMovieCreativeAssets, type GenerateMovieCreativeAssetsInput } from '@/ai/flows/generate-movie-creative-assets';
import { generateMoviePosterImage, type GenerateMoviePosterImageInput } from '@/ai/flows/generate-movie-poster-image';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

import AppHeader from '@/components/layout/app-header';
import MovieRatingForm from '@/components/movie/movie-rating-form';
import RatedMoviesList from '@/components/movie/rated-movies-list';
import RecommendationsDisplay from '@/components/movie/recommendations-display';
import { Loader2, Wand2, Film, Search, AlertCircle, User, ImageIcon, Database, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export interface RatedMovie {
  id: string;
  title: string;
  rating: number;
  posterDataUri: string;
  summary: string;
  createdAt?: Timestamp;
  release_date?: string | null;
  vote_average_tmdb?: number | null;
}

export interface RecommendedMovie {
  title: string;
  posterDataUri: string;
  summary: string;
  release_date?: string | null;
  vote_average_tmdb?: number | null;
}

// Interface for the structure of movies in the local JSON dataset
interface LocalMovieData {
  title: string;
  overview: string;
  poster_path: string;
  release_date?: string; // Optional, consistent with TMDB structure
  vote_average?: number; // Optional
}


const Home: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [analyzedMovieTypes, setAnalyzedMovieTypes] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingRatedMovies, setIsLoadingRatedMovies] = useState(true);
  const [isRatingMovie, setIsRatingMovie] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [localMovieDatabase, setLocalMovieDatabase] = useState<LocalMovieData[]>([]);

  useEffect(() => {
    setClientLoaded(true);
    // Fetch the local movie database subset
    fetch('/movie_database_subset.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok for movie_database_subset.json');
        }
        return response.json();
      })
      .then((data: LocalMovieData[]) => setLocalMovieDatabase(data))
      .catch(error => {
        console.warn("Could not load local movie database subset from /movie_database_subset.json. Falling back to placeholders/AI generation. Error:", error);
        setLocalMovieDatabase([]); // Ensure it's an empty array on error
        toast({
          title: "Local Data Notice",
          description: "Could not load local movie_database_subset.json. Movie details will rely on placeholders or AI.",
          variant: "default",
          duration: 7000,
        })
      });
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

  const fetchMovieDetailsFromLocalSubset = async (movieTitle: string): Promise<Partial<RatedMovie> | null> => {
    if (localMovieDatabase.length === 0) {
      // console.log("Local movie database is empty or not loaded. Cannot search for:", movieTitle);
      return null;
    }
    // Simple case-insensitive search, for more complex needs, a more robust search or API would be better
    const foundMovie = localMovieDatabase.find(movie => movie.title.toLowerCase() === movieTitle.toLowerCase());

    if (foundMovie) {
      return {
        summary: foundMovie.overview || "Summary not available from local data.",
        posterDataUri: foundMovie.poster_path ? `https://image.tmdb.org/t/p/w500${foundMovie.poster_path}` : `https://placehold.co/300x450.png?text=${encodeURIComponent(movieTitle)}`,
        release_date: foundMovie.release_date || null,
        vote_average_tmdb: foundMovie.vote_average || null,
      };
    }
    return null;
  };


  const handleMovieRated = async (movieRatingInput: { title: string, rating: number }) => {
    if (!clientLoaded || !user) {
      toast({ title: 'Login Required', description: 'Please log in to rate movies.', variant: 'destructive'});
      return;
    }
    setIsRatingMovie(true);

    const movieDetails = await fetchMovieDetailsFromLocalSubset(movieRatingInput.title);

    let ratedMovieDataForFirestore: Omit<RatedMovie, 'id' | 'createdAt'> & { createdAt: Timestamp };


    if (movieDetails) {
        ratedMovieDataForFirestore = {
          title: movieRatingInput.title,
          rating: movieRatingInput.rating,
          summary: movieDetails.summary || "Summary not available from local data.",
          posterDataUri: movieDetails.posterDataUri || `https://placehold.co/300x450.png?text=${encodeURIComponent(movieRatingInput.title)}`,
          release_date: movieDetails.release_date || null,
          vote_average_tmdb: movieDetails.vote_average_tmdb || null,
          createdAt: Timestamp.now(),
        };
        toast({ title: 'Movie Details Found!', description: `Using details for "${movieRatingInput.title}" from local data.`});
    } else {
        ratedMovieDataForFirestore = {
          title: movieRatingInput.title,
          rating: movieRatingInput.rating,
          summary: "Your rating has been recorded. Detailed summary not found in local data.",
          posterDataUri: `https://placehold.co/300x450.png?text=${encodeURIComponent(movieRatingInput.title)}`,
          release_date: null,
          vote_average_tmdb: null,
          createdAt: Timestamp.now(),
        };
        toast({ title: 'Using Placeholders', description: `Details for "${movieRatingInput.title}" not found in local data. Basic info saved.`});
    }

    try {
      const ratedMoviesCol = collection(db, `users/${user.uid}/ratedMovies`);
      await addDoc(ratedMoviesCol, ratedMovieDataForFirestore);
      toast({ title: 'Movie Rated!', description: `"${movieRatingInput.title}" added to your list.` });
    } catch (error: any) {
      console.error("Error saving rated movie: ", error);
      toast({ title: 'Rating Failed', description: error.message || 'Could not save your rating. Please try again.', variant: 'destructive' });
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
      .map((movie) => `${movie.title} (User Rating: ${movie.rating}/5${movie.release_date ? `, Released: ${movie.release_date}` : ''}${movie.vote_average_tmdb ? `, Avg Rating: ${movie.vote_average_tmdb}/10` : ''})`)
      .join('; ');

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
    toast({ title: 'Fetching Recommendations...', description: 'AI is picking out some movie titles for you.' });

    try {
      const input: GeneratePersonalizedRecommendationsInput = { movieTypes: analyzedMovieTypes };
      const result: GeneratePersonalizedRecommendationsOutput = await generatePersonalizedRecommendations(input);

      toast({ title: 'Fetching Details & Posters...', description: 'Looking up movie details from local data or generating with AI. This may take a moment.', duration: 15000 });

      const recommendedMoviesWithAssets: RecommendedMovie[] = await Promise.all(
        result.recommendations.map(async (recTitle) => {
          let movieDetails = await fetchMovieDetailsFromLocalSubset(recTitle);

          if (movieDetails && movieDetails.posterDataUri && movieDetails.summary) {
             return {
              title: recTitle,
              summary: movieDetails.summary,
              posterDataUri: movieDetails.posterDataUri, // Already includes full URL or placeholder
              release_date: movieDetails.release_date,
              vote_average_tmdb: movieDetails.vote_average_tmdb,
            };
          } else { // Fallback to AI generation if not in local subset
            try {
              toast({title: `AI Creating Assets...`, description: `Generating summary & poster for "${recTitle}".`});
              const creativeAssetsInput: GenerateMovieCreativeAssetsInput = { movieTitle: recTitle };
              const assets = await generateMovieCreativeAssets(creativeAssetsInput);

              const posterImageInput: GenerateMoviePosterImageInput = { movieTitle: recTitle, posterDescription: assets.posterDescription };
              const posterImage = await generateMoviePosterImage(posterImageInput);

              return {
                title: recTitle,
                summary: assets.summary,
                posterDataUri: posterImage.posterDataUri,
                release_date: null, // AI generated items won't have these unless we add to flow
                vote_average_tmdb: null,
              };
            } catch (aiError) {
              console.error(`Error generating AI assets for ${recTitle}:`, aiError);
              return {
                title: recTitle,
                summary: "Could not retrieve or generate summary.",
                posterDataUri: `https://placehold.co/300x450.png?text=${encodeURIComponent(recTitle)}%0A(Error)`,
                release_date: null,
                vote_average_tmdb: null,
              };
            }
          }
        })
      );

      setRecommendations(recommendedMoviesWithAssets);
      toast({ title: 'Recommendations Ready!', description: 'Check out your personalized list of movies below.' });
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

        <Alert variant="default" className="border-accent/50 bg-accent/10 text-accent-foreground">
          <FileJson className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent">Data Source Note</AlertTitle>
          <AlertDescription className="text-accent-foreground/80">
            This app attempts to fetch movie details from a local <strong>`public/movie_database_subset.json`</strong> file.
            If you haven&apos;t created and populated this file with a subset of your movie data (e.g., from Kaggle),
            it will use placeholders for rated movies and AI-generated assets for recommendations not found.
            Ensure your JSON file has `title`, `overview`, and `poster_path` fields.
          </AlertDescription>
        </Alert>

        <Card className="shadow-xl border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Search className="h-7 w-7 mr-3" /> Rate Your Movies
            </CardTitle>
            <CardDescription>Tell us about movies you&apos;ve seen. We&apos;ll try to find details from our local data subset or use placeholders.</CardDescription>
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
              ratedMovies.length > 0 && <RatedMoviesList movies={ratedMovies} />
            )}

            {ratedMovies.length > 0 && (
              <div className="text-center mt-8">
                <Button
                  onClick={handleAnalyzePreferences}
                  disabled={isLoadingAnalysis || !user || isRatingMovie}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md"
                >
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
               <Button
                  onClick={handleGetRecommendations}
                  disabled={isLoadingRecommendations || !user || isRatingMovie}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md"
                >
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
                <ImageIcon className="h-7 w-7 mr-3 text-accent" /> AI-Crafted & Local Data Picks!
              </h2>
              <p className="mb-6 text-muted-foreground">Movies are sourced from local data if available, otherwise AI generates unique assets.</p>
              <RecommendationsDisplay recommendations={recommendations} loading={isLoadingRecommendations} />
            </section>
          </>
        )}
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground border-t border-border mt-12">
        Movie Recs &copy; {new Date().getFullYear()} &bull; Powered by AI & Local Movie Data Subset
      </footer>
    </div>
  );
};

export default Home;
    
    
