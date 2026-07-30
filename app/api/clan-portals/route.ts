import {
  ClanPortalCreationRateLimitError,
  createClanPortal,
} from "../../../db/clan-portals";
import { isRecord } from "./validation";
import {
  clanPortalApiError,
  clanPortalJson,
  clanPortalMutationAllowed,
  readClanPortalJson,
} from "./http";

export async function POST(request: Request) {
  if (!clanPortalMutationAllowed(request)) {
    return clanPortalJson({ error: "この操作は許可されていません。" }, 403);
  }

  try {
    const payload = await readClanPortalJson(request);
    if (!isRecord(payload)) return clanPortalJson({ error: "入力内容を確認してください。" }, 400);
    const created = await createClanPortal(request, payload.displayName, payload.schedule);
    return clanPortalJson(created, 201);
  } catch (error) {
    if (error instanceof ClanPortalCreationRateLimitError) {
      return clanPortalJson(
        { error: "作成回数が上限に達しました。1時間ほど待ってからお試しください。" },
        429,
      );
    }
    return clanPortalApiError(error);
  }
}
