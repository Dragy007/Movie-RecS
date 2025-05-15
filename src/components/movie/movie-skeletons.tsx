import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MovieCardSkeleton: React.FC = () => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-0 relative aspect-[2/3] w-full">
        <Skeleton className="h-full w-full rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Skeleton className="h-5 w-1/3" />
      </CardFooter>
    </Card>
  );
};

interface MovieSkeletonsProps {
  count?: number;
}

const MovieSkeletons: React.FC<MovieSkeletonsProps> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default MovieSkeletons;
