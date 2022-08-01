import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import DiscordAdapter, {
  ROLE_NAME,
} from "../../../../adapters/discord.adapter";
import SupabaseAdapter from "../../../../adapters/supabase.adapter";

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
  const { assetId, memberId, blockchainAddress } = req.body;
  if (!memberId) {
    res.status(400).json({ error: "No member ID provided" });
  }
  if (!assetId) {
    res.status(400).json({ error: "No assetId provided" });
  }

  if (assetId !== Number(process.env.ASA_ID)) {
    res.status(400).json({ error: "Asset id is not supported" });
  }

  const supabase = await SupabaseAdapter.getInstance();
  const discord = await DiscordAdapter.getInstance();

  const user = await supabase.getUserTokenClaim_Algorand(memberId, assetId);

  // user already has the claim
  if (user) {
    // assign the role, just in case it got removed manually
    await discord.assignRole(memberId, ROLE_NAME);
    return res.status(200).json({ message: "Role already assigned" });
  }

  await discord.assignRole(memberId, ROLE_NAME);

  try {
    await supabase.setUserTokenClaim_Algorand(
      memberId,
      assetId,
      blockchainAddress
    );
    return res.status(201).json({ message: "Success" });
  } catch (err) {
    console.log(err);
    await discord.removeRole(memberId, ROLE_NAME);
    return res.status(500).json({ message: (err as Error).message });
  }
};

export default handler;
