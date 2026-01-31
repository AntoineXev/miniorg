interface TaskCardProps {
  id: string;
  title: string;
  meta: string;
  duration: string;
  className?: string;
}

export function TaskCard({
  id,
  title,
  meta,
  duration,
  className = "",
}: TaskCardProps) {
  return (
    <div
      id={id}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm ${className}`}
    >
      <div
        id={`${id}-check`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border transition-all duration-300"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-0 scale-0 transition-all duration-300"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div
          id={`${id}-title`}
          className="text-sm font-medium text-foreground truncate transition-all duration-300"
        >
          {title}
        </div>
        <div className="text-xs text-primary">{meta}</div>
      </div>
      <div className="rounded-md bg-secondary px-2.5 py-1 text-xs text-muted">
        {duration}
      </div>
    </div>
  );
}
