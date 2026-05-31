import { api } from "../client";
import {
  normalizeLoginResponse,
  unwrap,
  type ApiEnvelope,
  type BackendAuthToken,
} from "../backend";
import type { LoginResponse } from "../types";

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiEnvelope<BackendAuthToken> | LoginResponse>(
    "/auth/login",
    { email, password },
  );

  return normalizeLoginResponse(unwrap(data));
}
