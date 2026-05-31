import { api } from "../client";
import {
  fetchBackendHierarchy,
  normalizeHierarchy,
  normalizePiece,
  toBackendPiecePatch,
  unwrap,
  type ApiEnvelope,
  type BackendPiece,
} from "../backend";
import type { Piece } from "../types";

export async function getPieces() {
  const hierarchy = normalizeHierarchy(await fetchBackendHierarchy());
  return hierarchy.pieces;
}

export async function updatePiece(id: string, patch: Partial<Piece>) {
  const { data } = await api.patch<ApiEnvelope<BackendPiece> | BackendPiece>(
    `/pieces-de-rechange/${id}`,
    toBackendPiecePatch(patch),
  );

  return normalizePiece(unwrap(data));
}
