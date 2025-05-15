
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StarRating from './star-rating';
import { Film } from 'lucide-react';

interface MovieCardProps {
  title: string;
  posterDataUri: string; // Changed from posterUrl
  summary: string;
  rating?: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterDataUri, summary, rating }) => {
  const isPlaceholderDataUri = posterDataUri.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') || posterDataUri.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-50 duration-500 bg-card">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        {posterDataUri && !isPlaceholderDataUri ? (
          <Image
            src={posterDataUri}
            alt={`AI Generated Poster for ${title}`}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted rounded-t-lg">
            <Film className="w-16 h-16 text-muted-foreground opacity-50" />
          </div>
        )}
         {!isPlaceholderDataUri && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 h-[3.75rem]"> {/* approx 3 lines */}
          {summary || "AI generated summary will appear here."}
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
      {rating === undefined && ( // This means it's a recommended movie card
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
