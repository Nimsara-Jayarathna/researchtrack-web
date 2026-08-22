import { authApi } from "../api/authApi";
import { tokenStorage } from "@/services/tokenStorage";
import { resetSessionState } from "@/services/sessionState";
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
    .catch(() => {
      // A cached profile is never accepted as proof of authentication. If /me
      // and its single refresh attempt fail, start from an unauthenticated state.
      resetSessionState();
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}
