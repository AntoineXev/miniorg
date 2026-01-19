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
    onMutate: async (newTag) => {
      const toastId = toast.loading("Creating tag...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagKeys.all });

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.all);

      // Optimistically add the new tag
      if (previousTags) {
        const optimisticTag: Tag = {
          id: `temp-${Date.now()}`,
          name: newTag.name,
          color: newTag.color || "#6b7280",
          userId: "",
        };

        queryClient.setQueryData<Tag[]>(tagKeys.all, [...previousTags, optimisticTag]);
      }

      return { previousTags, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Tag created", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.all, context.previousTags);
      }
      toast.error("Failed to create tag", { id: context?.toastId });
      console.error(error);
    },
  });
}
