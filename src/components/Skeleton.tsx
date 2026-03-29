import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
  );
};

export default Skeleton;

export const CardSkeleton = () => (
  <div className="glass-surface-vibrant rounded-[40px] p-10 border border-white/10 space-y-6">
    <Skeleton className="w-16 h-16 rounded-[24px]" />
    <Skeleton className="w-3/4 h-8" />
    <Skeleton className="w-full h-20" />
    <Skeleton className="w-full h-12 rounded-2xl" />
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
    ))}
  </div>
);
