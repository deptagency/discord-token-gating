import { Client, DiscordAPIError, Guild, Intents, Role } from "discord.js";

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
export const ROLE_NAME = 'Invited';

export default class DiscordAdapter {
  client: Client;
  constructor() {
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  }

  async initialize() {
    await this.client.login(DISCORD_TOKEN);
  }

  getGuild() {
    const guild = this.client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) {
      throw new Error("Guild not configured properly");
    }
    return guild;
  }

  async getRole(guild: Guild, roleName: string) {
    const role = (await guild.roles.fetch()).find(
      (r) => r.name === roleName
    );
    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  }

  async getMember(guild: Guild, memberId: string) {
    const member = await guild.members.fetch(memberId);
    if (!member) {
      throw new Error("Member not found");
    }
    return member;
  }

  async assignRole(memberId: string, roleName: string) {
    const guild = this.getGuild();
    const role = await this.getRole(guild, roleName);
    const member = await this.getMember(guild, memberId);

    if (member.roles.cache.find(role => role.name === roleName)) {
      // role already assigned, exit early
      return;
    }

    try {
      await member.roles.add(role);
    } catch (err) {
      const error = err as DiscordAPIError;
      throw error;
    }
  }

  async memberHasRole(memberId: string, roleName: string) {
    const guild = this.getGuild();
    const member = await this.getMember(guild, memberId);

    if (member.roles.cache.find(role => role.name === ROLE_NAME)) {
      // role already assigned, exit early
      return true;
    }

    return false;
  }

}
