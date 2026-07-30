import {
  deleteClanPortal,
  getClanPortal,
  updateClanPortal,
} from "../../../../db/clan-portals";
import { isClanPortalId, readBearerToken } from "../../../clan-portal";
import { isRecord } from "../validation";
import {
  clanPortalApiError,
  clanPortalEmpty,
  clanPortalJson,
  clanPortalMutationAllowed,
  readClanPortalJson,
} from "../http";

type RouteContext = { params: Promise<{ clanId: string }> };

async function authorizedRequest(request: Request, context: RouteContext) {
  const { clanId } = await context.params;
  const token = readBearerToken(request);
  return isClanPortalId(clanId) && token ? { clanId, token } : null;
}

export async function GET(request: Request, context: RouteContext) {
  const access = await authorizedRequest(request, context);
  if (!access) return clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);

  try {
    const portal = await getClanPortal(access.clanId, access.token);
    return portal
      ? clanPortalJson({ portal })
      : clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);
  } catch (error) {
    return clanPortalApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!clanPortalMutationAllowed(request)) {
    return clanPortalJson({ error: "この操作は許可されていません。" }, 403);
  }
  const access = await authorizedRequest(request, context);
  if (!access) return clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);

  try {
    const payload = await readClanPortalJson(request);
    if (!isRecord(payload)) return clanPortalJson({ error: "入力内容を確認してください。" }, 400);
    const result = await updateClanPortal(
      access.clanId,
      access.token,
      payload.displayName,
      payload.schedule,
      payload.expectedRevision,
    );
    if (result.status === "updated") return clanPortalJson({ portal: result.portal });
    if (result.status === "conflict") {
      return clanPortalJson(
        { error: "別の更新が保存されています。最新情報を読み直してください。" },
        409,
      );
    }
    return clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);
  } catch (error) {
    return clanPortalApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!clanPortalMutationAllowed(request)) {
    return clanPortalJson({ error: "この操作は許可されていません。" }, 403);
  }
  const access = await authorizedRequest(request, context);
  if (!access) return clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);

  try {
    const deleted = await deleteClanPortal(access.clanId, access.token);
    return deleted
      ? clanPortalEmpty(204)
      : clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);
  } catch (error) {
    return clanPortalApiError(error);
  }
}
