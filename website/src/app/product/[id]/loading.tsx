import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-10 py-12 space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>

        {/* Hero Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-[48px]" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-16 w-full rounded-full" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-14 w-full max-w-md mx-auto rounded-full" />
          <Skeleton className="h-[300px] w-full rounded-[48px]" />
        </div>
      </main>
    </div>
  );
}
