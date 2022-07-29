import axios from "axios";

export interface AlgorandAsset {
  amount: number;
  "asset-id": number;
  deleted: boolean;
  "is-frozen": boolean;
}

export interface AlgorandAccount {
  address: string;
  amount: number;
  assets: AlgorandAsset[];
}

const ASA_ID = process.env.ASA_ID as string;

// Adjusted env variables here so frontend app can use the adapter
// in case of
const ALGORAND_NETWORK = (process.env.ALGORAND_NETWORK ||
  process.env.NEXT_PUBLIC_ALGORAND_NETWORK) as
  | "mainnet"
  | "testnet"
  | "betanet";

const AlgoExplorerIndexerURLs = {
  mainnet: "https://algoindexer.algoexplorerapi.io/v2",
  testnet: "https://algoindexer.testnet.algoexplorerapi.io/v2",
  betanet: "https://algoindexer.betanet.algoexplorerapi.io/v2",
};

export default class AlgorandAdapter {
  static instance: AlgorandAdapter;
  static algoExplorerBaseUrl: string;
  // prevents class being initialized with `new` syntax
  private constructor() {}

  static getInstance() {
    if (!AlgorandAdapter.instance) {
      AlgorandAdapter.instance = new AlgorandAdapter();

      this.algoExplorerBaseUrl = AlgoExplorerIndexerURLs[
        ALGORAND_NETWORK
      ] as string;
    }

    return AlgorandAdapter.instance;
  }

  async getAccount(address: string) {
    const result = await axios.get(
      `${AlgorandAdapter.algoExplorerBaseUrl}/accounts/${address}`
    );

    if (result.status !== 200) {
      throw new Error("failed to fetch account details");
    }

    const account = result.data.account as AlgorandAccount;

    return account;
  }
}
