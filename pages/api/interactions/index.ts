import { NextApiRequest, NextApiResponse } from "next";
import { APIApplicationCommandInteraction } from "discord-api-types/v10";
import withDiscordInteraction from "../../../middleware/discord-interaction";
import DiscordAdapter, { ROLE_NAME } from "../../../adapters/discord.adapter";

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
  if (interaction.data.name !== "invite") {
    return res.status(200).json({
      type: 4,
      data: {
        content: "Invalid command.",
        flags: 1 << 6,
      },
    });
  }

  // when user hits slash command from within the server,
  // the user id is within the member object. If they
  // hit the command from DMs, the user id is in the user object.
  const memberId = interaction.member
    ? interaction.member.user.id
    : interaction.user?.id;

  if (!memberId) {
    throw new Error("missing user id");
  }

  return res.status(200).json({
    type: 4,
    data: {
      content: `${BASE_URL}/connect/${memberId}`,
      flags: 1 << 6,
    },
  });
};

export default withDiscordInteraction(handler);
