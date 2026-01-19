import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { tagKeys } from "../queries/tags";
import type { Tag } from "../types";

export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      ApiClient.post<Tag>("/api/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tag");
      console.error(error);
    },
  });
}
