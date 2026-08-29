import { toVersionedApiPath } from "@/app/config/apiVersion";
import { apiClient } from "@/services/apiClient";

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type ApiClient = typeof apiClient;

type CreateAccountApiDeps = {
  apiClient: ApiClient;
};

const USERS_BASE = toVersionedApiPath("/api/users");

export function createAccountApi({ apiClient }: CreateAccountApiDeps) {
  return {
    changePassword(payload: ChangePasswordPayload): Promise<void> {
      return apiClient.patch<void>(`${USERS_BASE}/me/password`, payload);
    },
  };
}

export const accountApi = createAccountApi({ apiClient });
