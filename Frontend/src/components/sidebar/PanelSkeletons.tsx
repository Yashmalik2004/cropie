import React from 'react';

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-neutral-200/70 ${className}`} />
);

const SkeletonCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export const FarmOverviewSkeleton: React.FC = () => (
  <div className='space-y-3'>
    <div className='relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-3.5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2.5'>
            <SkeletonBlock className='h-10 w-10' />
            <SkeletonBlock className='h-4 w-32' />
          </div>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            <SkeletonBlock className='h-5 w-16 rounded-full' />
            <SkeletonBlock className='h-5 w-20 rounded-full' />
          </div>
        </div>
        <div className='flex flex-col items-end gap-1.5 min-w-[128px]'>
          <SkeletonBlock className='h-3 w-full' />
          <SkeletonBlock className='h-3 w-full' />
          <SkeletonBlock className='h-3 w-3/4' />
        </div>
      </div>
    </div>

    <SkeletonCard className='border-emerald-200'>
      <div className='mb-2.5 flex items-center justify-between'>
        <SkeletonBlock className='h-4 w-36' />
        <SkeletonBlock className='h-5 w-16 rounded-full' />
      </div>
      <SkeletonBlock className='h-2 w-full' />
      <SkeletonBlock className='mt-2 h-3 w-5/6' />
      <SkeletonBlock className='mt-3 h-2 w-full' />
      <div className='mt-2.5 grid grid-cols-3 gap-2'>
        <SkeletonBlock className='h-6' />
        <SkeletonBlock className='h-6' />
        <SkeletonBlock className='h-6' />
      </div>
    </SkeletonCard>

    <SkeletonCard>
      <SkeletonBlock className='h-4 w-28' />
      <SkeletonBlock className='mt-2 h-3 w-full' />
      <SkeletonBlock className='mt-1.5 h-3 w-11/12' />
      <SkeletonBlock className='mt-1.5 h-3 w-3/4' />
    </SkeletonCard>

    <SkeletonCard className='border-emerald-200/70'>
      <SkeletonBlock className='h-3.5 w-24' />
      <div className='mt-2 grid grid-cols-2 gap-1.5'>
        <SkeletonBlock className='h-10' />
        <SkeletonBlock className='h-10' />
      </div>
      <SkeletonBlock className='mt-2 h-1.5 w-full' />
    </SkeletonCard>
  </div>
);

export const NDVITrendsSkeleton: React.FC = () => (
  <div className='space-y-3'>
    <SkeletonCard>
      <SkeletonBlock className='h-4 w-32' />
      <SkeletonBlock className='mt-3 h-32 w-full' />
    </SkeletonCard>

    <SkeletonCard>
      <SkeletonBlock className='h-4 w-28' />
      <div className='mt-2.5 grid grid-cols-3 gap-2'>
        <SkeletonBlock className='h-14' />
        <SkeletonBlock className='h-14' />
        <SkeletonBlock className='h-14' />
      </div>
    </SkeletonCard>

    <SkeletonCard>
      <SkeletonBlock className='h-4 w-24' />
      <SkeletonBlock className='mt-2 h-24 w-full' />
    </SkeletonCard>
  </div>
);

export const NewsSkeleton: React.FC = () => (
  <div className='space-y-3'>
    <SkeletonCard>
      <SkeletonBlock className='h-4 w-28' />
      <SkeletonBlock className='mt-2 h-3 w-full' />
      <SkeletonBlock className='mt-1.5 h-3 w-5/6' />
    </SkeletonCard>
    {[0, 1, 2].map(i => (
      <SkeletonCard key={i}>
        <SkeletonBlock className='h-3 w-3/4' />
        <SkeletonBlock className='mt-2 h-3 w-full' />
        <SkeletonBlock className='mt-1.5 h-3 w-2/3' />
        <div className='mt-2 flex items-center gap-2'>
          <SkeletonBlock className='h-3 w-16' />
          <SkeletonBlock className='h-3 w-12' />
        </div>
      </SkeletonCard>
    ))}
  </div>
);

export const MandiRatesSkeleton: React.FC = () => (
  <div className='space-y-3'>
    <SkeletonCard>
      <SkeletonBlock className='h-4 w-32' />
      <SkeletonBlock className='mt-2 h-3 w-full' />
      <SkeletonBlock className='mt-1.5 h-3 w-11/12' />
    </SkeletonCard>

    <SkeletonCard>
      <SkeletonBlock className='h-4 w-28' />
      <div className='mt-2.5 space-y-2'>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className='flex items-center justify-between gap-2'>
            <SkeletonBlock className='h-3 w-24' />
            <SkeletonBlock className='h-3 w-16' />
          </div>
        ))}
      </div>
    </SkeletonCard>
  </div>
);
