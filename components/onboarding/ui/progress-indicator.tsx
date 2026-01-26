type ProgressIndicatorProps = {
  current: number;
  total: number;
};

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <span className="text-sm text-gray-400">
      {current}/{total}
    </span>
  );
}
