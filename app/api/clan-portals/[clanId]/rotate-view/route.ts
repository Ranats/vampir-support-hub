import { rotateClanPortalViewToken } from "../../../../../db/clan-portals";
import { isClanPortalId, readBearerToken } from "../../../../clan-portal";
import {
  clanPortalApiError,
  clanPortalJson,
  clanPortalMutationAllowed,
} from "../../http";

type RouteContext = { params: Promise<{ clanId: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!clanPortalMutationAllowed(request)) {
    return clanPortalJson({ error: "この操作は許可されていません。" }, 403);
  }

  const { clanId } = await context.params;
  const token = readBearerToken(request);
  if (!isClanPortalId(clanId) || !token) {
    return clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);
  }

  try {
    const viewToken = await rotateClanPortalViewToken(clanId, token);
    return viewToken
      ? clanPortalJson({ viewToken })
      : clanPortalJson({ error: "クランポータルが見つかりません。" }, 404);
  } catch (error) {
    return clanPortalApiError(error);
  }
}
