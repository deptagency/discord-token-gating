import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from 'redis';
import Cors from "cors";
import DiscordAdapter, { ROLE_NAME } from "../../../adapters/discord.adapter";
import RedisAdapter from "../../../adapters/redis.adapter";

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

const saveUserToken = async (memberId: string, tokenId: string) => {
  const redis = createClient({
    url : process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    socket: {
      tls: true
    }
  });

  redis.on("error", err => console.log("Redis Client Error", err));

  await redis.connect();
  await redis.set(memberId, tokenId);
  return redis.quit();
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);
  const { memberId, tokenId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: "No member ID provided" });
  }

  const discordAdapter = await DiscordAdapter.getInstance();

  await discordAdapter.assignRole(memberId, ROLE_NAME);

  RedisAdapter.initialize();

  try {
    await RedisAdapter.set(memberId, tokenId);
  } catch (err) {
    // If saving the token <-> member association to the datastore fails, we should not keep the role.
    // Treat it as a transaction where the two actions either both succeed or both fail, never one or the other.
    await discordAdapter.removeRole(memberId, ROLE_NAME);
    return res.status(500).json({ message: (err as Error).message });
  }

  res.status(200).json({ message: "Success" });
};

export default handler;
