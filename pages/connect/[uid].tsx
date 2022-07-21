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

enum PermissionStatus {
  Loading,
  Success,
  Error,
  NoToken,
}

type BalanceReadProps = {
  address: string;
  uid: string;
  onContractRead: (balance: number) => void;
  onStatusChange: (newStatus: PermissionStatus) => void;
};
const BalanceRead = ({
  address,
  uid,
  onContractRead,
  onStatusChange,
}: BalanceReadProps) => {
  // This gets how many of our contract's token the user posesses, which we pass to the next component
  // to control the loop to enumerate over all of said tokens they hold.
  const { data, isError } = useContractRead({
    addressOrName: contract.networks[4].address,
    contractInterface: contract.abi,
    functionName: "balanceOf",
    args: address,
  });

  useEffect(() => {
    if (data && uid) {
      const parsedBalance = parseInt(data._hex, 16);
      if (parsedBalance > 0) {
        onStatusChange(PermissionStatus.Loading);
        onContractRead(parsedBalance);
      } else {
        onStatusChange(PermissionStatus.NoToken);
      }
    }
  }, [data, uid, onContractRead, onStatusChange]);

  useEffect(() => {
    if (isError) {
      onStatusChange(PermissionStatus.Error);
    }
  }, [isError, onStatusChange]);

  return null;
};

type TokenReadProps = {
  address: string;
  uid: string;
  contractBalance: number;
  onStatusChange: (newStatus: PermissionStatus) => void;
};

const TokenRead = ({
  address,
  uid,
  contractBalance,
  onStatusChange,
}: TokenReadProps) => {
  const contractReads: any[] = [];

  for (let i = 0; i < Number(contractBalance); i++) {
    // This is the only functionality I could find to get the specific token ID's of the user's current holdings. It's
    // pretty unsightly and roundabout to have a hook in a loop but it works. The docs said to use this in combination
    // with `balanceOf` which we called in the previous component, so that's how we got here.
    // https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721Enumerable-tokenOfOwnerByIndex-address-uint256-

    const read = useContractRead({
      addressOrName: contract.networks[4].address,
      contractInterface: contract.abi,
      functionName: "tokenOfOwnerByIndex",
      args: [address, i],
    });
    contractReads.push(read);
  }

  useEffect(() => {
    if (contractReads.some((read) => read.isError))
      onStatusChange(PermissionStatus.Error);
    if (contractReads.every((read) => read.data)) {
      const tokenIds = contractReads.map((read) =>
        parseInt(read.data?._hex, 16)
      );
      console.log(tokenIds);
      axios
        .post(`${BASE_URL}/api/permissions`, { memberId: uid, tokenIds })
        .then(() => onStatusChange(PermissionStatus.Success))
        .catch(() => onStatusChange(PermissionStatus.Error));
    }
    // Since `useContractRead` doesn't return an actual promise or observable, we have no way to watch them. Next best thing.
  }, [
    contractReads.every((read) => read.data) ||
      contractReads.some((read) => read.isError),
  ]);
  return null;
};

const Home: NextPage = () => {
  const router = useRouter();
  const { uid } = router.query;
  const { address, isConnected } = useAccount();
  const [showContract, setShowContract] = useState<Boolean>(false);
  const [contractBalance, setContractBalance] = useState<number>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>();

  useEffect(() => {
    if (isConnected) {
      setShowContract(true);
    } else {
      setShowContract(false);
    }
  }, [isConnected]);

  const handleContractRead = (data: number) => {
    setContractBalance(data);
  };

  const handleStatusChange = (newStatus: PermissionStatus) => {
    setPermissionStatus(newStatus);
  };

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
          {showContract && (
            <BalanceRead
              address={address as string}
              uid={uid as string}
              onContractRead={handleContractRead}
              onStatusChange={handleStatusChange}
            />
          )}
          {showContract && contractBalance !== undefined && (
            <TokenRead
              address={address as string}
              uid={uid as string}
              contractBalance={contractBalance}
              onStatusChange={handleStatusChange}
            />
          )}
          {showContract && (
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
