import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import type { NextComponentType, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useAccount, useContractRead } from "wagmi";
import abi from "../../contract/abi";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

type Props = {
  address: string;
  uid: string;
};
const ContractRead = ({ address, uid }: Props) => {
  const {
    data,
    isError,
    isLoading,
  } = useContractRead({
    addressOrName: "0x485dbef4a8e09a5c652b9d9672265e0da4324a46",
    contractInterface: abi,
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

  if (isLoading) return <p>Loading contract...</p>;
  if (isError) return <p>Error reading contract</p>;
  if (permissionStatus === "loading")
    return <p>Token found! Updating your Discord permissions...</p>;
  if (permissionStatus === "error")
    return <p>Error updating your Discord permissions</p>;
  if (permissionStatus === "success")
    return <p>Success! You now have full access to the Discord server.</p>;
    if (permissionStatus === "noToken")
    return <p>Uh-oh, looks like you don&apos;t have the required token.</p>;
  return null;
};

const Home: NextPage = () => {
  const router = useRouter();
  const { uid } = router.query;
  const { address, isConnected } = useAccount();
  const [showContract, setShowContract] = useState<Boolean>(false);
  useEffect(() => {
    if(isConnected) {
      setShowContract(true);
    } else {
      setShowContract(false)
    }
  }, [isConnected]);

  return (
    <div>
      <Head>
        <title>DEPT Discord Auth</title>
        <meta name="description" content="DEPT Discord NFT Auth" />
      </Head>

      <main className="grid h-screen place-items-center">
        <div className="grid grid-cols-1 justify-center gap-10 mx-auto">
          <h1 className="mx-auto text-2xl font-light text-gray-800  w-72 text-center">
            Connect your wallet to receive your channel invite
          </h1>
          <div className="mx-auto">
            <ConnectButton />
          </div>
          {showContract && (
            <ContractRead address={address as string} uid={uid as string} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
