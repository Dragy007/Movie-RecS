import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StarRating from './star-rating';
import { Film } from 'lucide-react';

interface MovieCardProps {
  title: string;
  posterUrl: string;
  summary: string;
  rating?: number;
  dataAiHint?: string;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterUrl, summary, rating, dataAiHint }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-50 duration-500">
      <CardHeader className="p-0 relative aspect-[2/3] w-full">
        <Image
          src={posterUrl}
          alt={`Poster for ${title}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg"
          data-ai-hint={dataAiHint || "movie poster"}
        />
        {!posterUrl.startsWith('https://placehold.co') && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {summary}
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
                <Film className="h-4 w-4 mr-2 text-primary"/> Recommended
            </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MovieCard;
