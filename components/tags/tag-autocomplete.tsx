"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TagSelectList } from "@/components/tags/tag-select-list";
import { useTagsQuery } from "@/lib/api/queries/tags";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TagAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
};

export function TagAutocomplete({
  value,
  onChange,
  selectedTag,
  onSelectTag,
  placeholder = "What do you need to do?",
  className,
  onKeyDown,
}: TagAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: tags } = useTagsQuery();

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

  useEffect(() => {
    setShowDropdown(showingAutocomplete);
    setSelectedIndex(0);
  }, [showingAutocomplete]);

  // Scroll selected item into view
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, showDropdown]);

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
        setSelectedIndex((prev) => Math.min(prev + 1, filteredTags.length - 1));
        return;
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      
      if (e.key === "Enter" && filteredTags.length > 0) {
        e.preventDefault();
        const selectedTag = filteredTags[selectedIndex];
        if (selectedTag) {
          handleSelectTag(selectedTag);
        }
        return;
      }
    }
    
    onKeyDown?.(e);
  };

  const handleSelectTag = (tag: Tag) => {
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
          />
        </div>
      )}
    </div>
  );
}
