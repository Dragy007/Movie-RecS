
import type { RecommendedMovie } from '@/app/page';
import MovieCard from './movie-card';
import MovieSkeletons from './movie-skeletons';

interface RecommendationsDisplayProps {
  recommendations: RecommendedMovie[];
  loading: boolean;
}

const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({ recommendations, loading }) => {
  if (loading) {
    return <MovieSkeletons count={5} />;
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-lg">No recommendations to show yet. Try analyzing your preferences first!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {recommendations.map((movie, index) => (
        <MovieCard
          key={`${movie.title}-${index}`} 
          title={movie.title}
          posterDataUri={movie.posterDataUri}
          summary={movie.summary}
          release_date={movie.release_date}
          vote_average_tmdb={movie.vote_average_tmdb}
          isRecommendation={true}
          // Rating is not applicable for recommended movies here by the user
        />
      ))}
    </div>
  );
};

export default RecommendationsDisplay;
    
    