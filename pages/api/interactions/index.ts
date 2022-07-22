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

  if (!interaction.member?.user.id) {
    throw new Error("missing user id");
  }

  const discordAdapter = await DiscordAdapter.getInstance();

  const roleAlreadyAssigned = await discordAdapter.memberHasRole(
    interaction.member.user.id,
    ROLE_NAME
  );

  if (roleAlreadyAssigned) {
    return res.status(200).json({
      type: 4,
      data: {
        content: "Role already assigned!",
        flags: 1 << 6,
      },
    });
  }

  return res.status(200).json({
    type: 4,
    data: {
      content: `${BASE_URL}/connect/${interaction?.member?.user.id}`,
      flags: 1 << 6,
    },
  });
};

export default withDiscordInteraction(handler);
