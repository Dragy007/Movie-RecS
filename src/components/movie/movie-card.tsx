
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StarRating from './star-rating';
import { Film, CalendarDays, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_CHARS_COLLAPSED = 120; // Character threshold to offer "Show more"

  const isLikelyBase64 = posterDataUri.startsWith('data:image/');
  const isPlaceholdCo = posterDataUri.startsWith('https://placehold.co/');
  const isTMDB = posterDataUri.startsWith('https://image.tmdb.org/');
  
  const isGenericPlaceholderUri = posterDataUri.includes('placehold.co'); // Simpler check for any placehold.co
  
  const showActualImage = isLikelyBase64 || isPlaceholdCo || isTMDB;
  // Fallback icon logic will be based on if we have a valid image URI vs a generic text placeholder for placehold.co
  const useGenericFallbackIcon = isPlaceholdCo && posterDataUri.includes("?text=");


  const processedSummary = summary || (isRecommendation ? "AI-generated summary." : "No summary available.");
  const needsToggle = processedSummary.length > MAX_CHARS_COLLAPSED;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-50 duration-500 bg-card">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        {showActualImage && !useGenericFallbackIcon ? (
          <Image
            src={posterDataUri}
            alt={`Poster for ${title}`}
            data-ai-hint={isPlaceholdCo && !posterDataUri.includes("?text=") ? "movie poster" : undefined}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            unoptimized={isGenericPlaceholderUri} 
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
        <CardDescription 
          className={cn(
            "text-sm text-muted-foreground",
            (!isExpanded && needsToggle) ? "line-clamp-3 h-[3.75rem] mb-1" : "mb-2" // Apply clamp and fixed height only when collapsed and needing toggle
          )}
        >
          {processedSummary}
        </CardDescription>
        {needsToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-accent hover:text-accent/90 font-medium mt-1 mb-2 focus:outline-none"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show less" : "Show more..."}
          </button>
        )}
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
      
      <CardFooter className="p-4 border-t border-border mt-auto"> {/* Added mt-auto to push footer down */}
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
    
