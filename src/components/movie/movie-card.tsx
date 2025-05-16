
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StarRating from './star-rating';
import { Film } from 'lucide-react';

interface MovieCardProps {
  title: string;
  posterDataUri: string;
  summary: string;
  rating?: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterDataUri, summary, rating }) => {
  // Check if posterDataUri is a placeholder from placehold.co or a base64 data URI
  const isLikelyBase64 = posterDataUri.startsWith('data:image/');
  const isPlaceholdCo = posterDataUri.startsWith('https://placehold.co/');
  
  // Determine if we should treat it as a real image or show a fallback
  // A simple 1x1 transparent pixel or a very short data URI might also be placeholders
  const isGenericPlaceholderUri = posterDataUri.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=') ||
                                  posterDataUri.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

  const showActualImage = (isLikelyBase64 && !isGenericPlaceholderUri) || isPlaceholdCo;


  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-50 duration-500 bg-card">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        {showActualImage ? (
          <Image
            src={posterDataUri}
            alt={`Poster for ${title}`}
            data-ai-hint={isPlaceholdCo ? "movie poster" : undefined} // Add hint if it's a generic placehold.co
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            unoptimized={isPlaceholdCo} // Next.js might not optimize external generic placeholders well by default
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted rounded-t-lg">
            <Film className="w-16 h-16 text-muted-foreground opacity-50" />
          </div>
        )}
         {showActualImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 h-[3.75rem]">
          {summary || "No summary available."}
        </CardDescription>
      </CardContent>
      {rating !== undefined && (
        <CardFooter className="p-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-accent">{rating.toFixed(1)}/5.0</span>
          </div>
        </CardFooter>
      )}
      {rating === undefined && ( 
         <CardFooter className="p-4 border-t border-border">
            <div className="flex items-center text-sm text-muted-foreground">
                <Film className="h-4 w-4 mr-2 text-primary"/> AI Recommended
            </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MovieCard;

    