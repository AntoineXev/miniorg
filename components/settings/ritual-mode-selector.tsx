"use client";

import Image from "next/image";
import { SelectCard } from "@/components/ui/select-card";
import type { RitualMode } from "@/lib/api/types";

const ritualModeOptions: {
  value: RitualMode;
  title: string;
  description: string;
  image: string;
}[] = [
  {
    value: "separate",
    title: "Separate",
    description: "Daily planning in the morning, wrap-up in the evening",
    image: "/images/ritual-separate.svg",
  },
  {
    value: "morning",
    title: "Morning ritual",
    description: "Wrap-up yesterday + plan today, all in the morning",
    image: "/images/ritual-morning.svg",
  },
  {
    value: "evening",
    title: "Evening ritual",
    description: "Wrap-up today + plan tomorrow, all in the evening",
    image: "/images/ritual-evening.svg",
  },
];

type RitualModeSelectorProps = {
  value?: RitualMode;
  onChange: (mode: RitualMode) => void;
  disabled?: boolean;
};

export function RitualModeSelector({ value, onChange, disabled }: RitualModeSelectorProps) {
  return (
    <div className="space-y-3">
      {ritualModeOptions.map((option) => (
        <SelectCard
          key={option.value}
          icon={
            <Image
              src={option.image}
              alt={option.title}
              width={40}
              height={40}
              className="rounded-lg"
            />
          }
          title={option.title}
          description={option.description}
          selected={value === option.value}
          onSelect={() => onChange(option.value)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export { ritualModeOptions };
