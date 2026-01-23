"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TagSelectList } from "@/components/tags/tag-select-list";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { usePlatform } from "@/lib/hooks/use-platform";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const MANAGE_TAGS_INDEX = -1; // Special index for "Gérer mes tags"

type TagAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  /** When true and autoFocus is enabled, triggers focus. Use modal's isOpen state. */
  focusTrigger?: boolean;
};

export function TagAutocomplete({
  value,
  onChange,
  selectedTag,
  onSelectTag,
  placeholder = "What do you need to do?",
  className,
  onKeyDown,
  autoFocus = false,
  focusTrigger = false,
}: TagAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: tags } = useTagsQuery();
  const { isTauri } = usePlatform();
  const router = useRouter();

  // Detect if user typed # and extract search query
  const hashMatch = value.match(/#(\w*)$/);
  const searchQuery = hashMatch ? hashMatch[1].toLowerCase() : "";
  const showingAutocomplete = !!hashMatch;

  // Flatten and filter tags for keyboard navigation
  const filteredTags = useMemo(() => {
    if (!tags || !showingAutocomplete) return [];
    
    const flatTags: Tag[] = [];
    tags.forEach((tag) => {
      if (!tag.parentId) {
        flatTags.push(tag);
        tag.children?.forEach((child) => {
          flatTags.push(child);
        });
      }
    });
    
    return flatTags.filter((tag) => {
      if (selectedTag?.id === tag.id) return false;
      if (!searchQuery) return true;
      return tag.name.toLowerCase().includes(searchQuery);
    });
  }, [tags, showingAutocomplete, searchQuery, selectedTag]);

  // Total items including "Gérer mes tags" option
  const totalItems = filteredTags.length + 1;
  const isManageTagsSelected = selectedIndex === filteredTags.length;

  useEffect(() => {
    setShowDropdown(showingAutocomplete);
    setSelectedIndex(0);
  }, [showingAutocomplete]);

  // Auto focus input with delay (needed for Tauri panel to be ready)
  useEffect(() => {
    if (autoFocus && focusTrigger) {
      // Use multiple attempts with increasing delays for reliability
      const timers = [
        setTimeout(() => inputRef.current?.focus(), 50),
        setTimeout(() => inputRef.current?.focus(), 150),
        setTimeout(() => inputRef.current?.focus(), 300),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [autoFocus, focusTrigger]);

  // Scroll selected item into view
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selector = isManageTagsSelected
        ? '[data-index="manage-tags"]'
        : `[data-index="${selectedIndex}"]`;
      const selectedElement = dropdownRef.current.querySelector(selector);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, showDropdown, isManageTagsSelected]);

  const handleManageTags = async () => {
    setShowDropdown(false);
    // Remove the # from input
    const newValue = value.replace(/#\w*$/, "");
    onChange(newValue);

    if (isTauri) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const currentLabel = getCurrentWindow().label;

      if (currentLabel === "quick-add") {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("focus_main_window", { path: "/settings/tags" });
        } catch (error) {
          console.error("Failed to focus main window:", error);
        }
      } else {
        router.push("/settings/tags");
      }
    } else {
      router.push("/settings/tags");
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (isManageTagsSelected) {
          handleManageTags();
        } else if (filteredTags[selectedIndex]) {
          handleSelectTag(filteredTags[selectedIndex]);
        }
        return;
      }
    }

    onKeyDown?.(e);
  };

  const handleSelectTag = (tag: Tag | null) => {
    if (!tag) return;
    // Remove the # and search query from input
    const newValue = value.replace(/#\w*$/, "");
    onChange(newValue);
    onSelectTag(tag);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none text-lg font-medium w-full",
          className
        )}
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full max-w-sm bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <TagSelectList
            onSelectTag={handleSelectTag}
            selectedTagId={selectedTag?.id}
            searchQuery={searchQuery}
            selectedIndex={selectedIndex}
            showKeyboardHighlight
            showManageTagsOption
            manageTagsHighlighted={isManageTagsSelected}
            onManageTagsClick={handleManageTags}
          />
        </div>
      )}
    </div>
  );
}
