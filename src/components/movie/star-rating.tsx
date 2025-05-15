import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, totalStars = 5, size = 'md', className }) => {
  const starSizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className={cn("flex items-center space-x-0.5", className)}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={starValue}
            className={cn(
              starSizeClass,
              starValue <= Math.round(rating) ? "text-accent fill-accent" : "text-muted-foreground fill-muted"
            )}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{rating} out of {totalStars} stars</span>
    </div>
  );
};

export default StarRating;
