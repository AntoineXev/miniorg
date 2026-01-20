"use client";

import { cn } from "@/lib/utils";

type ColorPickerProps = {
  selectedColor: string;
  onSelectColor: (color: string) => void;
};

// 24 color palette matching the provided screenshots
const COLORS = [
  "#E91E63", // pink
  "#EC407A", // lighter pink
  "#CE93D8", // light purple
  "#9C27B0", // purple
  "#7E57C2", // medium purple
  "#673AB7", // deep purple
  "#42A5F5", // light blue
  "#2196F3", // blue
  "#757575", // gray
  "#26C6DA", // cyan
  "#00ACC1", // dark cyan
  "#00897B", // teal
  "#00796B", // dark teal
  "#009688", // teal green
  "#4CAF50", // green
  "#66BB6A", // light green
  "#8BC34A", // lime green
  "#FDD835", // yellow
  "#FFB300", // amber
  "#FF9800", // orange
  "#FF6F00", // dark orange
  "#FF5722", // deep orange
  "#F4511E", // red orange
  "#E64A19", // dark red orange
  "#8D6E63", // brown
  "#6D4C41", // dark brown
];

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-12 gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelectColor(color)}
          className={cn(
            "w-6 h-6 rounded-full transition-all hover:scale-110",
            selectedColor === color && "ring-2 ring-offset-2 ring-foreground"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
