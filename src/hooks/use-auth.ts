
// This file is kept for consistency but its functionality is now within src/contexts/auth-context.tsx
// You can directly import useAuth from '@/contexts/auth-context'
import { useAuth as useAuthFromContext } from '@/contexts/auth-context';

/**
 * @deprecated Prefer importing `useAuth` directly from `@/contexts/auth-context`.
 */
export const useAuth = useAuthFromContext;
