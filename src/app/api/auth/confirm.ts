import { type EmailOtpType } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createApiClient } from "~/utils/supabase/auth/client";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "authHandler" });

function stringOrFirstString(item: string | string[] | undefined) {
  return Array.isArray(item) ? item[0] : item;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).appendHeader("Allow", "GET").end();
    return;
  }

  const queryParams = req.query;
  const token_hash = stringOrFirstString(queryParams.token_hash);
  const type = stringOrFirstString(queryParams.type);

  let next = "/";

  if (token_hash && type) {
    const supabase = createApiClient(req, res);
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash
    });
    if (error) {
      logger.error(error, "failed to verify otp");
    } else {
      next = stringOrFirstString(queryParams.next) ?? "/";
    }
  }

  res.redirect(next);
}
