import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import type { GetServerSideProps, NextPage, NextPageContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useContractRead, useContractReads } from "wagmi";
import jwt from "jsonwebtoken";
import contract from "../../solidity/build/contracts/DiscordInvite.json";
import StatusMessage from "../../components/StatusMessage";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

export enum PermissionStatus {
  Loading,
  Success,
  Error,
  TokensAlreadyClaimed,
  RoleAlreadyAssigned,
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
    addressOrName: contract.networks[5].address,
    contractInterface: contract.abi,
    functionName: "balanceOf",
    args: address,
  });

  useEffect(() => {
    if (data && uid) {
      const parsedBalance = parseInt(data._hex, 16);
      if (parsedBalance > 0) {
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
  token: string;
};
const TokenRead = ({
  address,
  uid,
  contractBalance,
  onStatusChange,
  token,
}: TokenReadProps) => {
  const { data } = useContractReads({
    contracts: Array.from({ length: Number(contractBalance) }, (_, i) => ({
      addressOrName: contract.networks[5].address,
      contractInterface: contract.abi,
      functionName: "tokenOfOwnerByIndex",
      args: [address, i],
    })),
    onSuccess(data) {
      if (data[0]) {
        onStatusChange(PermissionStatus.Loading);
        axios
          .post(
            `${BASE_URL}/api/permissions`,
            {
              memberId: uid,
              tokenIds: data.map((i) => `${parseInt(i._hex, 16)}`),
              address: address,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then((resp) => {
            if (resp.status === 201) {
              onStatusChange(PermissionStatus.Success);
            } else if (resp.status === 200) {
              onStatusChange(PermissionStatus.RoleAlreadyAssigned);
            }
          })
          .catch((err) => {
            if (err.status === 403) {
              onStatusChange(PermissionStatus.TokensAlreadyClaimed);
            } else {
              onStatusChange(PermissionStatus.Error);
            }
          });
      }
    },
    onError(err) {
      onStatusChange(PermissionStatus.Error);
    },
  });

  return null;
};

interface Props {
  token: string;
}
const Home: NextPage<Props> = ({ token }) => {
  const router = useRouter();
  const { uid } = router.query;
  const { address, isConnected } = useAccount();
  const [showContractStatus, setShowContractStatus] = useState<Boolean>(false);
  const [contractBalance, setContractBalance] = useState<number>();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>();

  useEffect(() => {
    if (isConnected) {
      setShowContractStatus(true);
    } else {
      setPermissionStatus(null);
      setShowContractStatus(false);
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
          <div className="px-4 pb-6 flex place-content-center">
            <ConnectButton />
          </div>
          {showContractStatus && address !== undefined && (
            <BalanceRead
              address={address as string}
              uid={uid as string}
              onContractRead={handleContractRead}
              onStatusChange={handleStatusChange}
            />
          )}
          {showContractStatus && contractBalance !== undefined && (
            <TokenRead
              address={address as string}
              uid={uid as string}
              contractBalance={contractBalance}
              onStatusChange={handleStatusChange}
              token={token}
            />
          )}
          {showContractStatus && (
            <StatusMessage permissionStatus={permissionStatus} />
          )}
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const secret = process.env.JWT_SECRET as string;
  const memberId = context.query.uid;
  const token = jwt.sign({ sub: memberId }, secret, {
    expiresIn: "600s",
  });
  return {
    props: { token },
  };
};

export default Home;
