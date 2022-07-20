import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import DiscordAdapter, { ROLE_NAME } from "../../../adapters/discord.adapter";

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
  if (!req.body.memberId) {
    res.status(400).json({ error: "No member ID provided" });
  }

  const discordAdapter = await DiscordAdapter.getInstance();

  await discordAdapter.assignRole(req.body.memberId, ROLE_NAME);

  res.status(200).json({ message: "Success" });
};

export default handler;
