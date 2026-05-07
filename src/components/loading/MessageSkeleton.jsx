/**
 * MessageSkeleton Component
 * 
 * A skeleton loader component specifically for message list placeholders.
 * Displays multiple message-shaped placeholders while messages are loading.
 * 
 * @component
 * @example
 * <MessageSkeleton count={5} />
 */

import SkeletonLoader from './SkeletonLoader';

export default function MessageSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3">
          {/* Avatar */}
          <SkeletonLoader
            shape="circle"
            width="w-10"
            height="h-10"
            className="flex-shrink-0"
          />
          
          {/* Message content */}
          <div className="flex-1 space-y-2">
            {/* Sender name and timestamp */}
            <div className="flex gap-2">
              <SkeletonLoader width="w-24" height="h-3" />
              <SkeletonLoader width="w-16" height="h-3" />
            </div>
            
            {/* Message text */}
            <SkeletonLoader width="w-full" height="h-4" />
            <SkeletonLoader width="w-3/4" height="h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
