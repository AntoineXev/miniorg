// Event system for task updates across components

export const TASK_UPDATED_EVENT = "task-updated";

export function emitTaskUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TASK_UPDATED_EVENT));
  }
}

export function onTaskUpdate(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener(TASK_UPDATED_EVENT, callback);
    return () => window.removeEventListener(TASK_UPDATED_EVENT, callback);
  }
  return () => {};
}
