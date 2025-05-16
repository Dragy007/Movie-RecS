
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, "Movie title is required").max(100, "Title is too long"),
  rating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});

interface MovieRatingFormProps {
  onMovieRated: (movie: { title: string; rating: number }) => Promise<void>; // Changed to Promise<void>
  disabled?: boolean;
}

const MovieRatingForm: React.FC<MovieRatingFormProps> = ({ onMovieRated, disabled }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      rating: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.rating === 0) {
        form.setError("rating", { type: "manual", message: "Please select a rating." });
        return;
    }
    await onMovieRated({ // Added await
      title: values.title,
      rating: values.rating,
    });
    form.reset();
    form.setValue('rating', 0); // Explicitly reset rating to 0
    form.clearErrors(); // Clear any existing errors
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={disabled} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Movie Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Inception" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the title of a movie you&apos;ve watched.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
                <FormControl>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Button
                        key={starValue}
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          field.onChange(starValue);
                          if (form.formState.errors.rating) {
                            form.clearErrors("rating");
                          }
                        }}
                        className={cn(
                          "border-accent hover:bg-accent/10",
                          field.value === starValue ? "bg-accent text-accent-foreground hover:bg-accent/90" : "text-accent"
                        )}
                        aria-pressed={field.value === starValue}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <Star className={cn("h-5 w-5", field.value === starValue ? "fill-current" : "fill-transparent")} />
                      </Button>
                    ))}
                  </div>
                </FormControl>
                <FormDescription>
                  Select a rating from 1 to 5 stars.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>
        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={disabled}>
          {disabled ? 'Adding Movie...' : 'Add Rated Movie'}
        </Button>
      </form>
    </Form>
  );
};

export default MovieRatingForm;
