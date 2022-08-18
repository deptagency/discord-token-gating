import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StatusMessage from "../../../components/StatusMessage";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import AlgorandAdapter, {
  AlgorandAccount,
} from "../../../adapters/algorand.adapter";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

enum PermissionStatus {
  Loading,
  Success,
  Error,
  TokensAlreadyClaimed,
  RoleAlreadyAssigned,
  NoToken,
}

const Home: NextPage = () => {
  const router = useRouter();
  const { uid } = router.query;
  const [connected, setConnected] = useState<boolean>(false);
  const [connector, setConnector] = useState<WalletConnect>();
  const [account, setAccount] = useState<AlgorandAccount>();
  const [address, setAddress] = useState<string>();
  const [showContractStatus, setShowContractStatus] = useState<Boolean>(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>();

  useEffect(() => {
    subscribeToEvents();
  }, [connector, address]);

  const connect = async () => {
    // bridge url
    const bridge = "https://bridge.walletconnect.org";

    // create new connector
    const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });

    setConnector(connector);

    // check if already connected
    if (!connector.connected) {
      // create new session
      await connector.createSession();
    }
  };

  const subscribeToEvents = () => {
    if (!connector) {
      return;
    }

    connector.on("session_update", async (error, payload) => {
      console.log(`connector.on("session_update")`);

      if (error) {
        throw error;
      }

      const { chainId, accounts } = payload.params[0];
      onSessionUpdate(accounts, chainId);
    });

    connector.on("connect", (error, payload) => {
      console.log(`connector.on("connect")`);

      if (error) {
        throw error;
      }

      onConnect(payload);
    });

    connector.on("disconnect", (error, payload) => {
      console.log(`connector.on("disconnect")`);

      if (error) {
        throw error;
      }

      onDisconnect();
    });

    if (connector.connected) {
      const { chainId, accounts } = connector;

      onSessionUpdate(accounts, chainId);
    }
  };

  const killSession = async () => {
    if (connector) {
      connector.killSession();
    }
    resetApp();
  };

  const resetApp = async () => {
    // await this.setState({ ...INITIAL_STATE });
  };

  const onConnect = async (payload: any) => {
    const { chainId, accounts } = payload.params[0];

    onSessionUpdate(accounts, chainId);
  };

  const onDisconnect = () => {
    resetApp();
  };

  const onSessionUpdate = async (accounts: string[], chainId: number) => {
    const address = accounts[0];
    // setChainId(chainId);
    // setAccounts(accounts);
    setAddress(address);
    setConnected(true);
    await getAccountAssets();
  };

  const getAccountAssets = async () => {
    if (!address) {
      return;
    }
    try {
      const algorandAdapter = AlgorandAdapter.getInstance();
      const account = await algorandAdapter.getAccount(address);
      setAccount(account);
      setShowContractStatus(true);

      if (account.assets) {
        const targetAssetId = Number(process.env.NEXT_PUBLIC_ASA_ID);
        let assetFound = false;
        account.assets.forEach((asset) => {
          if (asset["asset-id"] === targetAssetId && asset.amount > 0) {
            assetFound = true;
          }
        });

        if (assetFound) {
          setPermissionStatus(PermissionStatus.Loading);
          handleTokenForAccess(targetAssetId);
        } else {
          setPermissionStatus(PermissionStatus.NoToken);
        }
      } else {
        setPermissionStatus(PermissionStatus.NoToken);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTokenForAccess = async (assetId: number) => {
    return axios
      .post(`${BASE_URL}/api/permissions/algorand`, {
        memberId: uid,
        assetId,
        blockchainAddress: address,
      })
      .then((resp) => {
        if (resp.status === 201) {
          setPermissionStatus(PermissionStatus.Success);
        } else if (resp.status === 200) {
          setPermissionStatus(PermissionStatus.RoleAlreadyAssigned);
        }
      })
      .catch((err) => {
        if (err.status === 403) {
          setPermissionStatus(PermissionStatus.TokensAlreadyClaimed);
        } else {
          setPermissionStatus(PermissionStatus.Error);
        }
      });
  };

  return (
    <div>
      <Head>
        <title>DEPT Discord Auth - Algorand</title>
        <meta name="description" content="DEPT Discord NFT Auth" />
      </Head>
      <main className="grid h-screen place-items-center bg-gradient-to-r from-sky-500 to-indigo-500 px-4">
        <div className="bg-white my-3 overflow-hidden drop-shadow-2xl rounded-2xl ">
          <div className="px-8 py-5 sm:px-6 ">
            <h1 className="mx-auto text-xl sm:text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500  text-center">
              Connect your wallet to receive your channel invite
            </h1>
          </div>
          {!connected && (
            <>
              <div className="px-4 pb-6 flex place-content-center">
                <button onClick={connect}>Click me</button>
              </div>
            </>
          )}
          {showContractStatus && (
            <div className="h-12 mx-auto w-full text-center ">
              <StatusMessage
                message="Token found! Updating your Discord permissions..."
                show={permissionStatus === PermissionStatus.Loading}
              />
              <StatusMessage
                message="Error updating your Discord permissions"
                show={permissionStatus === PermissionStatus.Error}
              />
              <StatusMessage
                message="These tokens have already been assigned to another user."
                show={
                  permissionStatus === PermissionStatus.TokensAlreadyClaimed
                }
              />
              <StatusMessage
                message="Access has already been granted."
                show={permissionStatus === PermissionStatus.RoleAlreadyAssigned}
              />
              <StatusMessage
                message="Success! Full access to the Discord server granted."
                show={permissionStatus === PermissionStatus.Success}
              />
              <StatusMessage
                message="Uh-oh, you don't have the required token."
                show={permissionStatus === PermissionStatus.NoToken}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
