const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config({ path: "./.env.local" });

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;

/**
 * Slash commands must be registered with Discord via an API endpoint.
 * This script can be run from your local machine to register a new
 * slash command, update the config path to match your local env file
 * and can use npm run deployCommands
 */

const main = async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("invite-algorand")
      .setDescription(
        "Replies with a unique invite link for full access to this server."
      ),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  rest
    .put(Routes.applicationCommands(APP_ID), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
};
main();
