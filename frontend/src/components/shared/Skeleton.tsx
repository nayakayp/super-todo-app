import { cn } from '../../lib/utils';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden="true"
    />
  );
}

export function TodoItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <Skeleton className="w-5 h-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function TodoListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading todos">
      {Array.from({ length: count }).map((_, i) => (
        <TodoItemSkeleton key={i} />
      ))}
      <span className="sr-only">Loading todos...</span>
    </div>
  );
}
