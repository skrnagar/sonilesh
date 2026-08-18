export const API_ERROR_CODES = [
  "AUTH",
  "FORBIDDEN",
  "ENTITLEMENT_REQUIRED",
  "VALIDATION",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMIT",
  "NOT_CONFIGURED",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiOkBody<T> = {
  ok: true;
  data: T;
};

function requestIdFrom(request?: Request | null) {
  const header = request?.headers.get("x-request-id")?.trim();
  if (header) return header.slice(0, 128);
  return crypto.randomUUID();
}

function jsonHeaders(requestId: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-request-id", requestId);
  headers.set("cache-control", "no-store");
  return headers;
}

/** Never attach stack traces or env values to API error bodies. */
export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  request?: Request | null,
) {
  const requestId = requestIdFrom(request);
  const body: ApiErrorBody = {
    ok: false,
    error: { code, message },
  };
  return Response.json(body, { status, headers: jsonHeaders(requestId) });
}

export function jsonOk<T>(data: T, request?: Request | null, status = 200) {
  const requestId = requestIdFrom(request);
  const body: ApiOkBody<T> = { ok: true, data };
  return Response.json(body, { status, headers: jsonHeaders(requestId) });
}
