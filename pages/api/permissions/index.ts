import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import DiscordAdapter, { ROLE_NAME } from "../../../adapters/discord.adapter";
import SupabaseAdapter from "../../../adapters/supabase.adapter";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";

const cors = Cors({
  methods: ["GET", "HEAD", "POST"],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);
  const { tokenIds, memberId } = req.body;
  if (!memberId) {
    res.status(400).json({ error: "No member ID provided" });
  }
  if (!tokenIds) {
    res.status(400).json({ error: "No tokenIds provided" });
  }

  const supabase = await SupabaseAdapter.getInstance();
  const discord = await DiscordAdapter.getInstance();

  // in theory there should be no tokens already assigned, but
  // just in case we'll check. Ignoring case where some but not all
  // are assigned - just returning error if any already assigned
  // to another user
  const tokens = await supabase.getRowsByTokens(tokenIds);

  if (tokens.length === 0) {
    await discord.assignRole(memberId, ROLE_NAME);
    // wrap in a try/catch to treat as transaction
    // and remove discord roll if error occurs with supabase
    try {
      await supabase.insertRows(tokenIds, memberId);
      res.status(201).json({ message: "Success" });
    } catch (err) {
      await discord.removeRole(memberId, ROLE_NAME);
      return res.status(500).json({ message: (err as Error).message });
    }
  } else if (tokens.every((t) => t.discordMemberId === memberId)) {
    const hasRole = await discord.memberHasRole(memberId, ROLE_NAME);
    if (!hasRole) {
      await discord.assignRole(memberId, ROLE_NAME);
      res.status(201).json({ message: "success" });
    } else {
      res.status(200).json({ message: "Role already assigned" });
    }
  } else {
    res
      .status(403)
      .json({ error: "Tokens are already assigned to another user." });
  }
};

export default handler;
