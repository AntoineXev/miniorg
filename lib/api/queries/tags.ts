import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../client";
import type { Tag } from "../types";

export const tagKeys = {
  all: ["tags"] as const,
};

export function useTagsQuery() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => ApiClient.get<Tag[]>("/api/tags"),
  });
}
