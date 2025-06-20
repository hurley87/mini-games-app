# Auth Migration to Middleware + React Query

This document outlines the new authentication strategy using Next.js middleware and @tanstack/react-query, similar to modern patterns used in applications like the squabble repository.

## Overview

The new auth system provides:
- **Next.js Middleware**: Edge-based authentication checks for protected routes
- **React Query Integration**: Efficient state management for user data with caching and synchronization
- **Context Provider**: Centralized auth state accessible throughout the app
- **TypeScript Support**: Full type safety for auth-related operations

## Key Components

### 1. Middleware (`middleware.ts`)
- Runs on the edge for fast auth checks
- Protects routes automatically before they render
- Redirects unauthenticated users to public pages
- Excludes API routes, static assets, and public paths

### 2. Auth Library (`lib/auth.ts`)
- React Query hooks: `useAuth()`, `useUpdateUser()`, `useLogout()`, `useUserProfile()`
- API functions for user data management
- Type-safe interfaces for User and AuthState
- Query key management for cache invalidation

### 3. Auth Context (`lib/auth-context.tsx`)
- React Context provider for auth state
- Higher-order component `withAuth()` for route protection
- Centralized auth state management

### 4. Updated Providers (`app/providers.tsx`)
- Integrated AuthProvider with React Query
- Optimized QueryClient configuration
- Proper provider hierarchy

## Usage Examples

### Basic Auth Hook
```tsx
import { useAuthContext } from '@/lib/auth-context';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {user.displayName}!</div>;
}
```

### Protected Route
```tsx
import { withAuth } from '@/lib/auth-context';

function ProtectedPage() {
  return <div>This page requires authentication</div>;
}

export default withAuth(ProtectedPage);
```

### User Profile Management
```tsx
import { useUserProfile, useUpdateUser } from '@/lib/auth';

function UserProfile({ fid }: { fid: number }) {
  const { data: user, isLoading } = useUserProfile(fid);
  const updateUser = useUpdateUser();

  const handleUpdate = () => {
    updateUser.mutate({
      ...user,
      displayName: 'New Name'
    });
  };

  if (isLoading) return <div>Loading profile...</div>;
  return (
    <div>
      <h1>{user?.displayName}</h1>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

## Migration Steps

### 1. Replace App Initialization
Replace the current `AppInit` component with `AppInitV2`:

```tsx
// In app/layout.tsx or wherever AppInit is used
import { AppInitV2 } from './components/app-init-v2';

// Replace <AppInit /> with <AppInitV2 />
```

### 2. Update Components to Use Auth Context
Replace direct Farcaster context usage with the new auth context:

```tsx
// Before
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
const { context } = useFarcasterContext();
const user = context?.user;

// After
import { useAuthContext } from '@/lib/auth-context';
const { user, isAuthenticated } = useAuthContext();
```

### 3. Protect Routes
Add route protection where needed:

```tsx
// Option 1: HOC
export default withAuth(MyProtectedComponent);

// Option 2: Hook check
function MyComponent() {
  const { isAuthenticated } = useAuthContext();
  if (!isAuthenticated) return <Redirect to="/" />;
  // ... rest of component
}
```

## Benefits

### Performance
- **Edge-based auth checks**: Middleware runs on Vercel Edge Runtime
- **Optimized caching**: React Query handles intelligent caching and refetching
- **Reduced client-side redirects**: Auth checks happen before page render

### Developer Experience
- **Type safety**: Full TypeScript support with proper interfaces
- **Centralized state**: Single source of truth for auth state
- **Automatic updates**: React Query keeps auth state synchronized
- **Error handling**: Built-in error states and retry logic

### Maintainability
- **Separation of concerns**: Auth logic separated from UI logic
- **Reusable hooks**: Composable auth hooks for different use cases
- **Consistent patterns**: Standard React Query patterns throughout

## Configuration

### Environment Variables
No additional environment variables are required. The system uses the existing Farcaster SDK configuration.

### Query Client Options
The QueryClient is configured with sensible defaults:
- 1-minute stale time for queries
- 2 retry attempts for failed requests
- Disabled refetch on window focus for better UX

### Middleware Configuration
The middleware matcher excludes:
- API routes (`/api/*`)
- Static assets (`/_next/static/*`, `/_next/image/*`)
- Public files (`/public/*`)
- Files with extensions (images, fonts, etc.)

## Troubleshooting

### Common Issues

1. **TypeScript errors with SDK**: Use type assertion `(sdk as any).quickAuth.fetch` if needed
2. **Infinite loops**: Ensure proper dependency arrays in useEffect hooks
3. **Middleware redirects**: Check that public paths are properly excluded in middleware config

### Debug Mode
Enable React Query DevTools in development:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to providers
<ReactQueryDevtools initialIsOpen={false} />
```

## Future Enhancements

- **Session persistence**: Add localStorage/sessionStorage for auth state
- **Token refresh**: Implement automatic token refresh logic
- **Offline support**: Handle auth state during offline scenarios
- **Role-based access**: Extend auth system for different user roles