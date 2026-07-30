const MAX_REQUEST_BODY_BYTES = 16_384;

export class ClanPortalHttpInputError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClanPortalHttpInputError";
  }
}

export function clanPortalJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export function clanPortalEmpty(status: number): Response {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function readClanPortalJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new ClanPortalHttpInputError(415, "JSONで送信してください。");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    throw new ClanPortalHttpInputError(413, "送信内容が大きすぎます。");
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The 413 response remains authoritative even if cancellation races disconnect.
        }
        throw new ClanPortalHttpInputError(413, "送信内容が大きすぎます。");
      }
      chunks.push(value);
    }
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const raw = new TextDecoder().decode(bytes);

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ClanPortalHttpInputError(400, "JSONを読み取れませんでした。");
  }
}

export function clanPortalMutationAllowed(request: Request): boolean {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";
}

export function clanPortalApiError(error: unknown): Response {
  if (error instanceof ClanPortalHttpInputError) {
    return clanPortalJson({ error: error.message }, error.status);
  }
  if (error instanceof TypeError) {
    return clanPortalJson({ error: "入力内容を確認してください。" }, 400);
  }
  return clanPortalJson({ error: "クランポータルを処理できませんでした。" }, 503);
}
