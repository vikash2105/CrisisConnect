import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-shimmer bg-muted/50 rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

// Enhanced skeleton components for specific use cases
function IncidentCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border bg-background">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="h-full w-full bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

function WelcomeCardSkeleton() {
  return (
    <div className="mb-8 bg-card border border-border rounded-lg p-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  )
}

export { IncidentCardSkeleton, MapSkeleton, WelcomeCardSkeleton }
