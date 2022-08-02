import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import DiscordAdapter, { ROLE_NAME } from "../../../adapters/discord.adapter";
import SupabaseAdapter from "../../../adapters/supabase.adapter";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import EthereumAdapter from "../../../adapters/ethereum.adapter";

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
  runMiddleware(req, res, cors);
  // validate request body
  const { tokenIds, memberId, address } = req.body;
  if (!memberId) {
    res.status(400).json({ error: "No member ID provided" });
  }
  if (!tokenIds) {
    res.status(400).json({ error: "No tokenIds provided" });
  }
  if (!address) {
    res.status(400).json({ error: "No wallet provided" });
  }

  // Verify on chain token ownership
  const eth = await EthereumAdapter.getInstance();
  const addressTokenCount = await eth.getTokenBalance(address);

  if (addressTokenCount < tokenIds.length) {
    return res.status(400).json({ error: "Invalid tokens" });
  }
  const addressTokenIds = await eth.getTokensByAddress(
    address,
    addressTokenCount
  );
  if (!tokenIds.every((id: string) => addressTokenIds.includes(id))) {
    return res.status(400).json({ error: "Invalid tokens" });
  }

  // next check tokens to see if they are already claimed
  const supabase = await SupabaseAdapter.getInstance();
  const discord = await DiscordAdapter.getInstance();
  const claimedTokens = await supabase.getRowsByTokens(tokenIds);

  if (claimedTokens.length === 0) {
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
  } else {
    // insert all tokens into DB, overwriting existing ones if they exist
    await supabase.upsertRows(tokenIds, memberId);

    // next check initial claimedTokens to see if other members have
    // stale claims and need their role revoked
    const otherMembers = claimedTokens.reduce((unique, o) => {
      if (
        !unique.some((obj: any) => obj.discordMemberId === o.discordMemberId) &&
        o.discordMemberId !== memberId
      ) {
        unique.push(o.discordMemberId);
      }
      return unique;
    }, []);
    await Promise.all(
      otherMembers.map(async (memberId: string) => {
        const otherClaimedTokens = await supabase.getRowsByMember(memberId);
        if (otherClaimedTokens.length === 0) {
          await discord.removeRole(memberId, ROLE_NAME);
        }
      })
    );

    // lastly update role of requesting member if needed
    const hasRole = await discord.memberHasRole(memberId, ROLE_NAME);
    if (!hasRole) {
      await discord.assignRole(memberId, ROLE_NAME);
      res.status(201).json({ message: "success" });
    } else {
      res.status(200).json({ message: "Role already assigned" });
    }
  }
};

export default handler;
