
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StarRating from './star-rating';
import { Film, CalendarDays, Star } from 'lucide-react'; // Added CalendarDays and Star

interface MovieCardProps {
  title: string;
  posterDataUri: string;
  summary: string;
  rating?: number; // User's rating for this movie in their list
  release_date?: string; // From Firestore dataset
  vote_average_tmdb?: number; // From Firestore dataset (typically out of 10)
  isRecommendation?: boolean; // Flag to distinguish AI recs
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  title, 
  posterDataUri, 
  summary, 
  rating, 
  release_date, 
  vote_average_tmdb,
  isRecommendation = false
}) => {
  const isLikelyBase64 = posterDataUri.startsWith('data:image/');
  const isPlaceholdCo = posterDataUri.startsWith('https://placehold.co/');
  const isTMDB = posterDataUri.startsWith('https://image.tmdb.org/');
  
  const isGenericPlaceholderUri = posterDataUri.includes('placehold.co') && posterDataUri.includes('text=');
  
  const showActualImage = isLikelyBase64 || isPlaceholdCo || isTMDB;
  const useGenericFallbackIcon = isGenericPlaceholderUri || (!isLikelyBase64 && !isPlaceholdCo && !isTMDB);

  const displaySummary = summary || (isRecommendation ? "AI-generated summary." : "No summary available.");

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-50 duration-500 bg-card">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        {showActualImage && !useGenericFallbackIcon ? (
          <Image
            src={posterDataUri}
            alt={`Poster for ${title}`}
            data-ai-hint={isPlaceholdCo ? "movie poster" : undefined}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            unoptimized={isPlaceholdCo} 
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted rounded-t-lg">
            <Film className="w-16 h-16 text-muted-foreground opacity-50" />
          </div>
        )}
         {showActualImage && !useGenericFallbackIcon && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 h-[3.75rem] mb-2">
          {displaySummary}
        </CardDescription>
        {release_date && (
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Released: {release_date}
          </div>
        )}
        {vote_average_tmdb !== undefined && vote_average_tmdb > 0 && (
           <div className="flex items-center text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 mr-1.5 text-yellow-500 fill-yellow-500" />
            TMDB Rating: {vote_average_tmdb.toFixed(1)}/10
          </div>
        )}
      </CardContent>
      
      {/* Footer for user's own rating or AI rec indication */}
      <CardFooter className="p-4 border-t border-border">
        {rating !== undefined ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">Your Rating:</span>
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-accent">{rating.toFixed(1)}/5.0</span>
          </div>
        ) : isRecommendation ? (
            <div className="flex items-center text-sm text-muted-foreground">
                <Film className="h-4 w-4 mr-2 text-primary"/> AI Recommended
            </div>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default MovieCard;
    
    