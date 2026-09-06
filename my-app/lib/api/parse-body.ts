import type { NextRequest } from "next/server";

/**
 * Reads a request body whether it's JSON (lightweight PATCH calls, e.g.
 * toggles) or multipart/form-data (forms that also attach an image file).
 * Returns a plain object either way so route handlers can keep a single
 * `body?.field` parsing style regardless of which the client sent.
 */
export async function parseRequestBody(
  request: NextRequest
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const result: Record<string, unknown> = {};
    for (const key of new Set(formData.keys())) {
      const values = formData.getAll(key);
      result[key] = values.length > 1 ? values : values[0];
    }
    return result;
  }

  return (await request.json().catch(() => null)) ?? {};
}

/** Parses a JSON-encoded array field that may arrive as a real array or a JSON string (from FormData). */
export function parseJsonArrayField(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
