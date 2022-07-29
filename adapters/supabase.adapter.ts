import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export default class SupabaseAdapter {
  static instance: SupabaseAdapter;
  static client: SupabaseClient;

  // prevents class being initialized with `new` syntax
  private constructor() {}

  static async getInstance() {
    if (!SupabaseAdapter.instance) {
      SupabaseAdapter.instance = new SupabaseAdapter();

      SupabaseAdapter.client = createClient(supabaseUrl, supabaseSecret);
    }

    return SupabaseAdapter.instance;
  }

  async getRowsByTokens(tokenIds: number[]) {
    const { data, error, status } = await SupabaseAdapter.client
      .from("nftUsers")
      .select("tokenId, discordMemberId")
      .in("tokenId", tokenIds);

    if (error) {
      throw error;
    }
    return data;
  }

  async getMemberByToken(tokenId: number) {
    const { data, error, status } = await SupabaseAdapter.client
      .from("nftUsers")
      .select("discordMemberId")
      .eq("tokenId", tokenId);

    if (error) {
      throw error;
    }
    return data;
  }
  async getRowsByMember(discordMemberId: string) {
    const { data, error } = await SupabaseAdapter.client
      .from("nftUsers")
      .select("tokenId, discordMemberId")
      .eq("discordMemberId", discordMemberId);

    if (error) {
      throw error;
    }
    return data;
  }
  async insertRows(tokenIds: number[], discordMemberId: string) {
    const { error } = await SupabaseAdapter.client.from("nftUsers").insert(
      tokenIds.map((tokenId) => ({ tokenId, discordMemberId })),
      { returning: "minimal" }
    );

    if (error) {
      throw error;
    }
  }
  async upsertRows(tokenIds: number[], discordMemberId: string) {
    const { error } = await SupabaseAdapter.client.from("nftUsers").upsert(
      tokenIds.map((tokenId) => ({ tokenId, discordMemberId })),
      { returning: "minimal" }
    );

    if (error) {
      throw error;
    }
  }
  async deleteRowByToken(tokenId: number) {
    const { error } = await SupabaseAdapter.client
      .from("nftUsers")
      .delete()
      .eq("tokenId", tokenId);

    if (error) {
      throw error;
    }
  }
}
