import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useContractRead } from "wagmi";
import contract from "../../solidity/build/contracts/DiscordInvite.json";
import StatusMessage from "../../components/StatusMessage";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

type ContractReadProps = {
  address: string;
  uid: string;
};
const ContractRead = ({ address, uid }: ContractReadProps) => {
  const { data, isError } = useContractRead({
    addressOrName: contract.networks[4].address, //Rinkeby testnet is network 4
    contractInterface: contract.abi,
    functionName: "balanceOf",
    args: address,
  });

  const [permissionStatus, setPermissionStatus] = useState<
    "loading" | "success" | "error" | "noToken"
  >();
  useEffect(() => {
    if (data && uid) {
      if (parseInt(data._hex, 16) > 0) {
        setPermissionStatus("loading");
        axios
          .post(`${BASE_URL}/api/permissions`, { memberId: uid })
          .then((resp) => setPermissionStatus("success"))
          .catch((err) => setPermissionStatus("error"));
      } else {
        setPermissionStatus("noToken");
      }
    }
  }, [data, uid]);

  if (isError)
    return (
      <p className="font-medium text-gray-900 h-12">Error reading contract.</p>
    );
  return (
    <div className="h-12 mx-auto w-full text-center ">
      <StatusMessage
        message="Token found! Updating your Discord permissions..."
        show={permissionStatus === "loading"}
      />
      <StatusMessage
        message="Error updating your Discord permissions"
        show={permissionStatus === "error"}
      />
      <StatusMessage
        message="Success! Full access to the Discord server granted."
        show={permissionStatus === "success"}
      />
      <StatusMessage
        message="Uh-oh, you don't have the required token."
        show={permissionStatus === "noToken"}
      />
    </div>
  );
};

const Home: NextPage = () => {
  const router = useRouter();
  const { uid } = router.query;
  const { address, isConnected } = useAccount();
  const [showContract, setShowContract] = useState<Boolean>(false);
  useEffect(() => {
    if (isConnected) {
      setShowContract(true);
    } else {
      setShowContract(false);
    }
  }, [isConnected]);

  return (
    <div>
      <Head>
        <title>DEPT Discord Auth</title>
        <meta name="description" content="DEPT Discord NFT Auth" />
      </Head>
      <main className="grid h-screen place-items-center bg-gradient-to-r from-sky-500 to-indigo-500 px-4">
        <div className="bg-white my-3 overflow-hidden drop-shadow-2xl rounded-2xl ">
          <div className="px-8 py-5 sm:px-6 ">
            <h1 className="mx-auto text-xl sm:text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500  text-center">
              Connect your wallet to receive your channel invite
            </h1>
          </div>
          <div className="px-4 py-5 sm:p-6 flex place-content-center">
            <ConnectButton />
          </div>
          <div className="px-4 py-4 sm:px-6 flex place-content-center">
            {showContract && (
              <ContractRead address={address as string} uid={uid as string} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
