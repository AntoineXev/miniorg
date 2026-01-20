import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { tagKeys } from "../queries/tags";
import type { Tag } from "../types";

// Hook to create a tag
export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Tag>) => ApiClient.post<Tag>("/api/tags", data),
    onMutate: async () => {
      const toastId = toast.loading("Creating tag...");
      await queryClient.cancelQueries({ queryKey: tagKeys.all });
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.all);
      return { previousTags, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Tag created", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (error, _, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.all, context.previousTags);
      }
      toast.error("Failed to create tag", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to update a tag
export function useUpdateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Tag> & { id: string }) =>
      ApiClient.patch<Tag>(`/api/tags?id=${data.id}`, data),
    onMutate: async () => {
      const toastId = toast.loading("Updating tag...");
      await queryClient.cancelQueries({ queryKey: tagKeys.all });
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.all);
      return { previousTags, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Tag updated", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (error, _, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.all, context.previousTags);
      }
      toast.error("Failed to update tag", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to delete a tag
export function useDeleteTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => ApiClient.delete(`/api/tags?id=${tagId}`),
    onMutate: async () => {
      const toastId = toast.loading("Deleting tag...");
      await queryClient.cancelQueries({ queryKey: tagKeys.all });
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.all);
      return { previousTags, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Tag deleted", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (error, _, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.all, context.previousTags);
      }
      toast.error("Failed to delete tag", { id: context?.toastId });
      console.error(error);
    },
  });
}
