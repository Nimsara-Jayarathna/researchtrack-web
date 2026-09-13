import { authApi } from "../api/authApi";
import { tokenStorage } from "@/services/tokenStorage";
import { isApiException } from "@/services/apiClient";
import { clearAuthenticationState } from "@/services/sessionState";
import { setAuthenticatedUser } from "./authState";

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapAuthSession(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = authApi
    .me()
    .then(({ user }) => {
      tokenStorage.setUser(user);
      setAuthenticatedUser(user);
    })
    .catch((error: unknown) => {
      // A cancelled bootstrap is a lifecycle event, not proof that the user is
      // unauthenticated. In particular, do not trigger another session reset.
      if (isApiException(error) && error.apiError.status === 499) {
        return;
      }

      // apiClient already performs refresh/session-expiry handling for a 401.
      // For any remaining bootstrap failure, clear local identity only; never
      // abort unrelated requests from public flows such as password reset.
      clearAuthenticationState();
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}
