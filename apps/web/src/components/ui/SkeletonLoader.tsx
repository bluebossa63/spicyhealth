export function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="bg-blush-light h-48 w-full" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 bg-blush-light rounded w-3/4" />
        <div className="h-3 bg-blush-light rounded w-full" />
        <div className="h-3 bg-blush-light rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-blush-light rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
