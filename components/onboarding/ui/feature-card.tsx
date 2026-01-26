import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-orange-500 mb-1">
        <Icon className="h-4 w-4" strokeWidth={1} />
        {title}
      </div>
      <div className="text-sm text-gray-500">
        {description}
      </div>
    </div>
  );
}
