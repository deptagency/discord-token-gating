import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import AlgorandAdapter, {
  AlgorandAccount,
} from "../../../../adapters/algorand.adapter";
import SupabaseAdapter from "../../../../adapters/supabase.adapter";
import DiscordAdapter, {
  ROLE_NAME,
} from "../../../../adapters/discord.adapter";

const cors = Cors({
  methods: ["GET"],
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

function verifyAccountHoldsToken(account: AlgorandAccount, assetId: number) {
  const assets = account.assets;

  if (!assets) return false;

  if (assets.length === 0) return false;

  let tokenFound = false;
  assets.forEach((asset) => {
    if (asset["asset-id"] === assetId && asset.amount > 0) {
      tokenFound = true;
    }
  });

  return tokenFound;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const supabase = await SupabaseAdapter.getInstance();
  const discord = await DiscordAdapter.getInstance();
  const algorandAdapter = AlgorandAdapter.getInstance();

  const users = await supabase.getAllUsers_Algorand();

  await Promise.all(
    users.map(async (user) => {
      const account = await algorandAdapter.getAccount(user.blockchainAddress);

      const tokenFound = verifyAccountHoldsToken(account, user.assetId);

      if (!tokenFound) {
        console.log(
          `Removing discord access for ${user.discordMemberId} discord member id`
        );
        await discord.removeRole(user.discordMemberId, ROLE_NAME);
        await supabase.removeUserTokenClaim_Algorand(user.id);
      }
    })
  );

  return res.status(200).send("OK");
};

export default handler;
