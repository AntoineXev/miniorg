"use client";

import { useMemo, useState, useCallback } from "react";
import { Pie, PieChart, Cell, Sector } from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Task, Tag } from "@/lib/api/types";
import { isSameDay, parseISO } from "date-fns";

type TimeDistributionChartProps = {
  tasks: Task[];
  tags: Tag[];
  date: Date;
};

type ChartDataItem = {
  name: string;
  value: number;
  fill: string;
  parentId?: string | null;
};

type HoverState = {
  ring: "outer" | "inner";
  index: number;
  name: string;
} | null;

export function TimeDistributionChart({ tasks, tags, date }: TimeDistributionChartProps) {
  const [hoverState, setHoverState] = useState<HoverState>(null);

  const { outerData, innerData, chartConfig, totalMinutes, parentToChildren } = useMemo(() => {
    // Get completed tasks for this date
    const completedTasks = tasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completedDate = typeof task.completedAt === "string"
        ? parseISO(task.completedAt)
        : task.completedAt;
      return isSameDay(completedDate, date);
    });

    // Create a map of tag IDs to full tag info (to get parent info)
    const tagMap = new Map<string, Tag>();
    const addTagsToMap = (tagList: Tag[]) => {
      tagList.forEach(tag => {
        tagMap.set(tag.id, tag);
        if (tag.children) {
          addTagsToMap(tag.children);
        }
      });
    };
    addTagsToMap(tags);

    // Track minutes for outer ring (parent/root tags) and inner ring (sub-tags or root if no children)
    const outerMinutes = new Map<string, { minutes: number; name: string; color: string }>();
    const innerMinutes = new Map<string, { minutes: number; name: string; color: string; parentId: string | null }>();

    completedTasks.forEach((task) => {
      const duration = task.duration || 30;
      // Get full tag from tagMap to access parentId
      const fullTag = task.tag ? tagMap.get(task.tag.id) : null;
      const tagName = task.tag?.name || null;
      const tagColor = task.tag?.color || "#6b7280";
      const tagId = task.tag?.id || null;
      const parentId = fullTag?.parentId || null;

      if (!tagId) {
        // No tag - add to "untagged"
        const outerKey = "untagged";
        const outerCurrent = outerMinutes.get(outerKey) || { minutes: 0, name: "No channel", color: "#6b7280" };
        outerMinutes.set(outerKey, { ...outerCurrent, minutes: outerCurrent.minutes + duration });

        const innerCurrent = innerMinutes.get(outerKey) || { minutes: 0, name: "No channel", color: "#6b7280", parentId: null };
        innerMinutes.set(outerKey, { ...innerCurrent, minutes: innerCurrent.minutes + duration });
      } else if (parentId) {
        // Has parent - parent goes to outer, tag goes to inner
        const parentTag = tagMap.get(parentId);
        const outerKey = parentId;
        const outerCurrent = outerMinutes.get(outerKey) || {
          minutes: 0,
          name: parentTag?.name || "Unknown",
          color: parentTag?.color || "#6b7280"
        };
        outerMinutes.set(outerKey, { ...outerCurrent, minutes: outerCurrent.minutes + duration });

        const innerKey = tagId;
        const innerCurrent = innerMinutes.get(innerKey) || {
          minutes: 0,
          name: tagName || "Unknown",
          color: tagColor,
          parentId: parentId
        };
        innerMinutes.set(innerKey, { ...innerCurrent, minutes: innerCurrent.minutes + duration });
      } else {
        // Root tag (no parent) - goes to both outer and inner
        const key = tagId;
        const outerCurrent = outerMinutes.get(key) || { minutes: 0, name: tagName || "Unknown", color: tagColor };
        outerMinutes.set(key, { ...outerCurrent, minutes: outerCurrent.minutes + duration });

        const innerCurrent = innerMinutes.get(key) || { minutes: 0, name: tagName || "Unknown", color: tagColor, parentId: null };
        innerMinutes.set(key, { ...innerCurrent, minutes: innerCurrent.minutes + duration });
      }
    });

    const total = Array.from(outerMinutes.values()).reduce((sum, item) => sum + item.minutes, 0);

    // Convert to chart data
    const config: ChartConfig = {
      value: { label: "Minutes" },
    };

    const outer: ChartDataItem[] = [];
    Array.from(outerMinutes.entries()).forEach(([key, { minutes, name, color }]) => {
      outer.push({ name: key, value: minutes, fill: color });
      config[key] = { label: name, color };
    });
    outer.sort((a, b) => b.value - a.value);

    // Build inner data aligned with outer ring
    // For each outer segment, add its children in sequence so they align angularly
    const inner: ChartDataItem[] = [];
    const childrenByParent = new Map<string, { key: string; minutes: number; name: string; color: string }[]>();

    // Group children by their parent
    Array.from(innerMinutes.entries()).forEach(([key, { minutes, name, color, parentId }]) => {
      if (!config[key]) {
        config[key] = { label: name, color };
      }
      const parentKey = parentId || key; // If no parent, use self as key
      if (!childrenByParent.has(parentKey)) {
        childrenByParent.set(parentKey, []);
      }
      childrenByParent.get(parentKey)!.push({ key, minutes, name, color });
    });

    // Build inner array following outer order
    outer.forEach(outerItem => {
      const children = childrenByParent.get(outerItem.name) || [];

      if (children.length === 0) {
        // No children data, show parent segment in inner ring too
        inner.push({ name: outerItem.name, value: outerItem.value, fill: outerItem.fill, parentId: null });
      } else if (children.length === 1 && children[0].key === outerItem.name) {
        // Only self (root tag without children), just add it
        inner.push({ name: children[0].key, value: children[0].minutes, fill: children[0].color, parentId: null });
      } else {
        // Has actual children - add them sorted by value within this parent's section
        const sortedChildren = [...children].sort((a, b) => b.minutes - a.minutes);
        sortedChildren.forEach(child => {
          inner.push({ name: child.key, value: child.minutes, fill: child.color, parentId: outerItem.name });
        });
      }
    });

    // Build parent to children mapping for tooltip
    const parentChildren = new Map<string, ChartDataItem[]>();
    inner.forEach(item => {
      const parentKey = item.parentId || item.name;
      if (!parentChildren.has(parentKey)) {
        parentChildren.set(parentKey, []);
      }
      if (item.parentId) {
        parentChildren.get(parentKey)!.push(item);
      }
    });

    return { outerData: outer, innerData: inner, chartConfig: config, totalMinutes: total, parentToChildren: parentChildren };
  }, [tasks, tags, date]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  const handleOuterEnter = useCallback((_: unknown, index: number) => {
    setHoverState({ ring: "outer", index, name: outerData[index].name });
  }, [outerData]);

  const handleInnerEnter = useCallback((_: unknown, index: number) => {
    setHoverState({ ring: "inner", index, name: innerData[index].name });
  }, [innerData]);

  const handleMouseLeave = useCallback(() => {
    setHoverState(null);
  }, []);

  // Check if a segment should be highlighted
  const isOuterHighlighted = (index: number) => {
    if (!hoverState) return false;
    if (hoverState.ring === "outer" && hoverState.index === index) return true;
    if (hoverState.ring === "inner") {
      const innerItem = innerData[hoverState.index];
      const outerItem = outerData[index];
      return innerItem.parentId === outerItem.name || innerItem.name === outerItem.name;
    }
    return false;
  };

  const isInnerHighlighted = (index: number) => {
    if (!hoverState) return false;
    if (hoverState.ring === "inner" && hoverState.index === index) return true;
    return false;
  };

  // Get opacity for segments
  const getOuterOpacity = (index: number) => {
    if (!hoverState) return 1;
    if (hoverState.ring === "outer") return hoverState.index === index ? 1 : 0.4;
    // Inner ring hover - highlight related parent
    const innerItem = innerData[hoverState.index];
    const outerItem = outerData[index];
    return (innerItem.parentId === outerItem.name || innerItem.name === outerItem.name) ? 1 : 0.4;
  };

  const getInnerOpacity = (index: number) => {
    if (!hoverState) return 1;
    if (hoverState.ring === "inner") return hoverState.index === index ? 1 : 0.4;
    // Outer ring hover - highlight related children
    const outerItem = outerData[hoverState.index];
    const innerItem = innerData[index];
    return (innerItem.parentId === outerItem.name || innerItem.name === outerItem.name) ? 1 : 0.4;
  };

  // Build tooltip content
  const renderTooltip = () => {
    if (!hoverState) return null;

    if (hoverState.ring === "outer") {
      const outerItem = outerData[hoverState.index];
      const children = parentToChildren.get(outerItem.name) || [];

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: outerItem.fill }} />
            <span>{chartConfig[outerItem.name]?.label || outerItem.name}</span>
            <span className="font-mono ml-auto">{formatDuration(outerItem.value)}</span>
          </div>
          {children.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-border/50 space-y-1">
              {children.map(child => (
                <div key={child.name} className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: child.fill }} />
                  <span className="opacity-70">{chartConfig[child.name]?.label || child.name}</span>
                  <span className="font-mono ml-auto opacity-70">{formatDuration(child.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      const innerItem = innerData[hoverState.index];
      const parentKey = innerItem.parentId;
      const parentItem = parentKey ? outerData.find(item => item.name === parentKey) : null;

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
          {parentItem && (
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5 pb-1.5 border-b border-border/50">
              <div className="w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: parentItem.fill }} />
              <span className="opacity-70">{chartConfig[parentItem.name]?.label || parentItem.name}</span>
              <span className="font-mono ml-auto opacity-70">{formatDuration(parentItem.value)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 font-medium">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: innerItem.fill }} />
            <span>{chartConfig[innerItem.name]?.label || innerItem.name}</span>
            <span className="font-mono ml-auto">{formatDuration(innerItem.value)}</span>
          </div>
        </div>
      );
    }
  };

  if (totalMinutes === 0) {
    return (
      <div>
        <h3 className="text-base font-semibold">Time by channel</h3>
        <p className="text-xs font-light italic pt-1 text-muted-foreground mb-6">
          How is your time distributed across channels?
        </p>
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          No completed tasks yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold">Time by channel</h3>
      <p className="text-xs italic font-light pt-1 text-muted-foreground mb-4">
        How is your time distributed across channels?
      </p>

      <div className="relative">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            {/* Outer ring - parent/root contexts */}
            <Pie
              data={outerData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={2}
              stroke="hsl(var(--background))"
              animationBegin={0}
              animationDuration={800}
              onMouseLeave={handleMouseLeave}
            >
              {outerData.map((entry, index) => (
                <Cell
                  key={`outer-${index}`}
                  fill={entry.fill}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease-out",
                    opacity: getOuterOpacity(index),
                    transform: isOuterHighlighted(index) ? "scale(1.03)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={(e) => handleOuterEnter(e, index)}
                />
              ))}
            </Pie>
            {/* Inner ring - sub-contexts or context if no sub */}
            <Pie
              data={innerData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={52}
              strokeWidth={2}
              stroke="hsl(var(--background))"
              animationBegin={200}
              animationDuration={800}
              onMouseLeave={handleMouseLeave}
            >
              {innerData.map((entry, index) => (
                <Cell
                  key={`inner-${index}`}
                  fill={entry.fill}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease-out",
                    opacity: getInnerOpacity(index),
                    transform: isInnerHighlighted(index) ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={(e) => handleInnerEnter(e, index)}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* Custom tooltip - below chart */}
      <div className="h-16 flex items-start justify-center mt-2 relative z-10">
        {hoverState ? renderTooltip() : (
          <div className="text-xs text-muted-foreground">Hover to see details</div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-1.5">
        {outerData.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: segment.fill }}
            />
            <span className="truncate flex-1">
              {chartConfig[segment.name]?.label || segment.name}
            </span>
            <span className="text-muted-foreground shrink-0">
              {formatDuration(segment.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
