import { Skeleton } from "@/components/ui/skeleton";

export type SkeletonType = "post" | "feed";

interface SkeletonLoaderProps {
  type: SkeletonType;
}

export function SkeletonLoader({ type }: SkeletonLoaderProps) {
  switch (type) {
    case "post":
      return (
        <div className="bg-card rounded-xl border p-4 w-full">
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            
            <div className="flex-1 space-y-3">
              {/* Header area */}
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 hidden sm:block rounded-full" />
              </div>

              {/* Body/Content lines */}
              <div className="space-y-2 mt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>

              {/* Cover Image */}
              <div className="mt-3">
                <Skeleton className="w-full h-56 rounded-lg" />
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </div>
      );

    case "feed":
      return (
        <div className="space-y-4 w-full">
          <SkeletonLoader type="post" />
          <SkeletonLoader type="post" />
          <SkeletonLoader type="post" />
        </div>
      );

    default:
      return null;
  }
}
