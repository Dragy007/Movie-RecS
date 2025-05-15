
import type { RatedMovie } from '@/app/page';
import MovieCard from './movie-card';

interface RatedMoviesListProps {
  movies: RatedMovie[];
}

const RatedMoviesList: React.FC<RatedMoviesListProps> = ({ movies }) => {
  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4 text-foreground">Your AI-Enhanced Rated Movies</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            title={movie.title}
            posterDataUri={movie.posterDataUri} // Changed from posterUrl
            summary={movie.summary}
            rating={movie.rating}
          />
        ))}
      </div>
    </div>
  );
};

export default RatedMoviesList;
