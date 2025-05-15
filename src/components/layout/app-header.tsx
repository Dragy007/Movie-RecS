import { Clapperboard } from 'lucide-react';
import Link from 'next/link';

const AppHeader = () => {
  return (
    <header className="bg-card border-b border-border shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Clapperboard className="h-8 w-8" />
          <span>Movie Recs</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
};

export default AppHeader;
