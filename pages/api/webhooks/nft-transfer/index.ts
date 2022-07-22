import { NextApiRequest, NextApiResponse } from "next";
import DiscordAdapter, {
  ROLE_NAME,
} from "../../../../adapters/discord.adapter";
import EthereumAdapter from "../../../../adapters/ethereum.adapter";
import SupabaseAdapter from "../../../../adapters/supabase.adapter";

// partial
interface SentinelRequestBody {
  events: {
    transaction: {
      transactionHash: string;
    };
  }[];
}

enum SUPPORTED_OPERATIONS {
  TRANSFER_FROM = "transferFrom",
  SAFE_MINT = "safeMint",
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body as SentinelRequestBody;

  console.log(`Received ${body.events.length} events`);

  const ethereumAdapter = EthereumAdapter.getInstance();

  // depending on configuration, we can receive many events at a time
  await Promise.all(
    body.events.map(async (event) => {
      const txHash = event.transaction.transactionHash;
      console.log(`Transaction: ${txHash}`);

      // verifies transaction is in the network and reads content from network instead of the request
      const transaction = await ethereumAdapter.getTransaction(txHash);

      // verifies transaction's "to" address is our contract, ensuring that it was our token that got tranferred and not something else
      if (transaction.to !== process.env.CONTRACT_ADDRESS) {
        throw new Error(
          "transaction.to address does not match contract address"
        );
      }

      // uses abi to read transaction.data
      const contractData = ethereumAdapter.parseContractData(transaction);

      const operation = contractData.name;
      let tokenId;

      if (operation === SUPPORTED_OPERATIONS.SAFE_MINT) {
        // we might want to support safeMint operation at some point
        // to read tokenId from safeMint operation, use LOG4
        console.log(`Operation safeMint is not supported.`);
        return;
      } else if (operation === SUPPORTED_OPERATIONS.TRANSFER_FROM) {
        // arguments are: from, to, tokenId
        tokenId = parseInt(contractData.args[2].toString());
      } else {
        console.log(`Operation ${operation} is not supported.`);
        return;
      }

      console.log(`Token found: ${tokenId}`);
      const supabase = await SupabaseAdapter.getInstance();
      const results = await supabase.getMemberByToken(tokenId);

      if (results.length > 0) {
        const { discordMemberId } = results[0];
        console.log(`Member ${discordMemberId} found, deleting row`);
        await supabase.deleteRowByToken(tokenId);

        const otherTokens = await supabase.getRowsByMember(discordMemberId);
        if (otherTokens.length === 0) {
          const discordAdapter = await DiscordAdapter.getInstance();
          await discordAdapter.removeRole(discordMemberId, ROLE_NAME);
          console.log(
            "Member has no other tokens assigned, role has been removed."
          );
        } else {
          console.log(
            "Member has other tokens assigned, keeping role assignment."
          );
        }
      } else {
        console.log(`No member found for token ${tokenId}, no updates needed.`);
      }
    })
  );

  return res.status(200).json({
    data: {
      ok: true,
    },
  });
};

export default handler;
