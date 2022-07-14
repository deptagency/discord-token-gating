import { NextApiRequest, NextApiResponse } from "next";
import { APIApplicationCommandInteraction } from "discord-api-types/v10";
import withDiscordInteraction from "../../../middleware/discord-interaction";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;
// disable body parsing, need the raw body to verify
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  interaction: APIApplicationCommandInteraction
) => {
  if (interaction.data.name === "ping") {
    return res.status(200).json({
      type: 4,
      data: {
        content: `${BASE_URL}/connect/${interaction?.member?.user.id}`,
      },
    });
  } else {
    return res.status(200).json({
      type: 4,
      data: {
        content: "Invalid command.",
      },
    });
  }
};

export default withDiscordInteraction(handler);
