import { useSyncExternalStore } from "react";
import type { ApiError } from "@/types";
import type { StoredUser } from "@/services/tokenStorage";

export type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: StoredUser | null;
  isLoading: boolean;
  error: ApiError | null;
};

let state: AuthState = {
  status: "bootstrapping",
  user: null,
  isLoading: false,
  error: null,
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function update(next: AuthState): void {
  state = next;
  emit();
}

export function getAuthState(): AuthState {
  return state;
}

export function subscribeAuthState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuthStateValue(): AuthState {
  return useSyncExternalStore(subscribeAuthState, getAuthState, getAuthState);
}

export function setAuthLoading(isLoading: boolean): void {
  update({
    ...state,
    isLoading,
    error: isLoading ? null : state.error,
  });
}

export function setAuthError(error: ApiError | null): void {
  update({
    ...state,
    isLoading: false,
    error,
  });
}

export function setAuthenticatedUser(user: StoredUser): void {
  update({
    status: "authenticated",
    user,
    isLoading: false,
    error: null,
  });
}

export function clearInMemoryAuthState(): void {
  update({
    status: "unauthenticated",
    user: null,
    isLoading: false,
    error: null,
  });
}
