import { NextApiRequest, NextApiResponse } from "next";
import nacl from "tweetnacl";
import { parseRawBodyAsString } from "../utils/body-parser";
import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY as string;

if (!DISCORD_PUBLIC_KEY) {
  throw new Error("Environment variables not configured correctly");
}

export type VerifyHeadersArgs = {
  timestamp: string;
  rawBody: string;
  signature: string;
};

export type DiscordInteractionApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse<APIInteractionResponse>,
  interaction: APIApplicationCommandInteraction
) => void | Promise<void>;

// Since we're doing serverless, incoming interactions are handled via webhook (rather than Gateway),
// and need to verify the headers sent from Discord to ensure they're valid.
// https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization

export const verifyHeaders = ({
  timestamp,
  rawBody,
  signature,
}: VerifyHeadersArgs) => {
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(DISCORD_PUBLIC_KEY, "hex")
  );
};

const withDiscordInteraction =
  (next: DiscordInteractionApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    if (typeof signature !== "string" || typeof timestamp !== "string") {
      return res.status(401).end("Invalid request signature");
    }

    try {
      const rawBody = await parseRawBodyAsString(req);
      const isVerified = verifyHeaders({ timestamp, rawBody, signature });
      if (!isVerified) {
        return res.status(401).end("Invalid request signature");
      }

      // Parse the message as JSON
      const interaction = JSON.parse(rawBody);
      const { type } = interaction;

      if (type === 1) {
        // PING message, respond with ACK as required by Discord for webhooks
        // https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction
        return res.status(200).json({ type: 1 });
      } else {
        return await next(req, res, interaction);
      }
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        message: "Oops, something went wrong parsing the request.",
      });
    }
  };

export default withDiscordInteraction;
