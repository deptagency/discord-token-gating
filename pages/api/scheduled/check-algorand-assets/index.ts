import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import AlgorandAdapter, {
  AlgorandAccount,
} from "../../../../adapters/algorand.adapter";

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

function verifyAccountHoldsToken(account: AlgorandAccount, assetId: string) {
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

  // const supabase = await SupabaseAdapter.getInstance();
  // const discord = await DiscordAdapter.getInstance();

  const algorandAdapter = AlgorandAdapter.getInstance();

  const asaId = process.env.ASA_ID as string;

  // For demo purposes only, this is bad approach!
  // TODO: Fetch ALL Discord users that have an algorand asset used for the invite

  // Some hardcoded address I found
  const retrievedAddresses = [
    "J4OBAJ6X4R32I6LBIJF374VB7WFMKUED54II46WXOP5MFVQTCFUOWJWDLY",
  ];

  await Promise.all(
    retrievedAddresses.map(async (address) => {
      const account = await algorandAdapter.getAccount(address);

      const tokenFound = verifyAccountHoldsToken(account, asaId);

      if (!tokenFound) {
        // TODO: remove entry from database
        // TODO: remove from discord
        // await discord.removeRole('memberId', ROLE_NAME)
      }
    })
  );

  return res.status(200).send("OK");
};

export default handler;
