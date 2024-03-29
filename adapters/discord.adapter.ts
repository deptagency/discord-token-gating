import { Client, DiscordAPIError, Guild, Intents, Role } from "discord.js";

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
export const ROLE_NAME = "Invited";

export default class DiscordAdapter {
  static instance: DiscordAdapter;
  static client: Client;

  // prevents class being initialized with `new` syntax
  private constructor() {}

  static async getInstance() {
    if (!DiscordAdapter.instance) {
      DiscordAdapter.instance = new DiscordAdapter();

      DiscordAdapter.client = new Client({ intents: [Intents.FLAGS.GUILDS] });
      await DiscordAdapter.client.login(DISCORD_TOKEN);
    }

    return DiscordAdapter.instance;
  }

  getGuild() {
    const guild = DiscordAdapter.client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) {
      throw new Error("Guild not configured properly");
    }
    return guild;
  }

  async getRole(guild: Guild, roleName: string) {
    const role = (await guild.roles.fetch()).find((r) => r.name === roleName);
    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  }

  async getMember(guild: Guild, memberId: string) {
    const member = await guild.members.fetch({ user: memberId, cache: false });
    if (!member) {
      throw new Error("Member not found");
    }
    return member;
  }

  async assignRole(memberId: string, roleName: string) {
    const guild = this.getGuild();
    const role = await this.getRole(guild, roleName);
    const member = await this.getMember(guild, memberId);

    if (member.roles.cache.find((role) => role.name === roleName)) {
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

  async removeRole(memberId: string, roleName: string) {
    const guild = this.getGuild();
    const role = await this.getRole(guild, roleName);
    const member = await this.getMember(guild, memberId);

    if (!member.roles.cache.find((role) => role.name === roleName)) {
      // role not found, exit early
      return;
    }

    try {
      await member.roles.remove(role);
    } catch (err) {
      const error = err as DiscordAPIError;
      throw error;
    }
  }

  async memberHasRole(memberId: string, roleName: string) {
    const guild = this.getGuild();
    const member = await this.getMember(guild, memberId);

    return !!member.roles.cache.find((role) => role.name === roleName);
  }
}
