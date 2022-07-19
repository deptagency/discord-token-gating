import { Client, DiscordAPIError, Intents, Role } from "discord.js";
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from 'redis';
import Cors from "cors";

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;

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

  try {
    await redis.connect();
    await redis.set(memberId, tokenId);
    redis.quit();
  } catch (e) {
    console.log(e);
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);
  const { memberId, tokenId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: "No member ID provided" });
  }

  //initialize discord client
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  await client.login(DISCORD_TOKEN);

  // load guild
  const targetGuild = await client.guilds.cache.get(DISCORD_GUILD_ID);
  if (targetGuild === undefined) {
    return res.status(500).json({ error: "Guild not configured properly" });
  }

  // load role
  const role = (await targetGuild.roles.fetch()).find(
    (r) => r.name === "Invited"
  );
  if (role === undefined) {
    return res.status(500).json({ error: "Role not found" });
  }

  // load member
  const member = await targetGuild.members.fetch(memberId);
  if (member === undefined) {
    return res.status(400).json({ error: "Member not found" });
  }

  // add role
  try {
    await member.roles.add(role);
    res.status(200).json({ message: "Success" });
  } catch (err) {
    const error = err as DiscordAPIError;
    return res
      .status(error.httpStatus || 500)
      .json({ error: error.message || "Unknown error" });
  }

  // store user and token info
  saveUserToken(memberId, tokenId);
};

export default handler;
