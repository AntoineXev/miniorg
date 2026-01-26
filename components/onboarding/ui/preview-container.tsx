import { cn } from "@/lib/utils";

type PreviewContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PreviewContainer({ children, className }: PreviewContainerProps) {
  return (
    <div
      className={cn(
        "h-full overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-start rounded-2xl p-6 shadow-sm h-[100%] relative w-[160%]">
      {children}
      </div>
    </div>
  );
}
