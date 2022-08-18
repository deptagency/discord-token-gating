import { ethers } from "ethers";
import contract from "../solidity/build/contracts/DiscordInvite.json";

const contractAddress = process.env.CONTRACT_ADDRESS as string;

export default class EthereumAdapter {
  static instance: EthereumAdapter;
  static provider: ethers.providers.BaseProvider;
  static contract: ethers.Contract;
  // prevents class being initialized with `new` syntax
  private constructor() {}

  static getInstance() {
    if (!EthereumAdapter.instance) {
      EthereumAdapter.instance = new EthereumAdapter();

      EthereumAdapter.provider = ethers.getDefaultProvider(
        process.env.ETHEREUM_NETWORK,
        {
          alchemy: process.env.ALCHEMY_KEY,
        }
      );
      EthereumAdapter.contract = new ethers.Contract(
        contractAddress,
        contract.abi,
        EthereumAdapter.provider
      );
    }

    return EthereumAdapter.instance;
  }

  async getTokenBalance(address: string) {
    const balance = await EthereumAdapter.contract.functions.balanceOf(address);

    const parsedBalance = Number(balance.toString());

    return parsedBalance;
  }

  async getTokensByAddress(address: string, tokenCount: number) {
    let tokens: String[] = [];
    await Promise.all(
      Array.from({ length: tokenCount }, async (_, i) => {
        const tokenResp =
          await EthereumAdapter.contract.functions.tokenOfOwnerByIndex(
            address,
            i
          );

        tokens.push(tokenResp.toString());
      })
    );
    return tokens;
  }
  async getTransaction(hash: string) {
    return await EthereumAdapter.provider.getTransaction(hash);
  }

  async getTransactionReceipt(hash: string) {
    return await EthereumAdapter.provider.getTransactionReceipt(hash);
  }

  parseContractData(transaction: ethers.Transaction) {
    const iface = new ethers.utils.Interface(contract.abi);
    const decoded = iface.parseTransaction(transaction);
    return decoded;
  }
}
