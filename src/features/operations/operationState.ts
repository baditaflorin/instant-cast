export type OperationStatus = "idle" | "running" | "cancelled" | "failed" | "succeeded";

export interface OperationState {
  id: string;
  status: OperationStatus;
  label: string;
  progress: number | null;
  cancellable: boolean;
  startedAt: number | null;
}

export const idleOperation: OperationState = {
  id: "idle",
  status: "idle",
  label: "Idle",
  progress: null,
  cancellable: false,
  startedAt: null,
};

export function startOperation(id: string, label: string, cancellable: boolean): OperationState {
  return {
    id,
    status: "running",
    label,
    progress: null,
    cancellable,
    startedAt: Date.now(),
  };
}

export function updateOperation(
  operation: OperationState,
  label: string,
  progress: number | null,
): OperationState {
  return {
    ...operation,
    label,
    progress: progress == null ? null : Math.max(0, Math.min(1, progress)),
  };
}

export function cancelOperation(operation: OperationState): OperationState {
  return { ...operation, status: "cancelled", cancellable: false };
}
