interface TimelineSlotProps {
  id: string;
  time: string;
  title: string;
}

export function TimelineSlot({ id, time, title }: TimelineSlotProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 pt-2 text-right text-xs text-muted-foreground">
        {time}
      </div>
      <div
        id={id}
        className="flex-1 rounded-lg bg-primary/10 px-3 py-2.5 opacity-0 -translate-x-4"
      >
        <div className="text-xs font-medium text-primary">{title}</div>
      </div>
    </div>
  );
}
