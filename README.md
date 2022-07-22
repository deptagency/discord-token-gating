This is a [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh) + [Next.js](https://nextjs.org/) project bootstrapped with [`create-rainbowkit`](https://github.com/rainbow-me/rainbowkit/tree/main/packages/create-rainbowkit).

## Getting Started

### Prerequisites

#### Environment

Recommended Node version is 18.6.0. If you're not using [nvm](https://github.com/nvm-sh/nvm), you should :wink:. This will use the correct version automatically, feeding from the project's `.nvmrc`. Make sure you run `nvm install 18` so you will have the correct version available.

1. Create a `.env.local` in the project root and slack a team member for values.
2. Run `npm install` from the project root.

#### Minting a Token

1. Run `npm install` from inside the `/solidity` directory.
2. Create the `secrets.json` inside the `/solidity` directory and slack a team member for the contents of this file.
3. From the project root, run `npm run mint` and follow the prompts.

### Running the App

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. (If you get a 404 it's working.)

To test full functionality, begin the bot flow in Discord by typing `/invite` in Discord (If you already have the "Invited" role, delete it from yourself). Click the link the bot provides and copy the path after the hostname, it should be in the format `/connect/<memberId>`. Paste this onto the end of `localhost:3000` (ex: `http://localhost:3000/connect/1234567890`). After following the flow, you should see the "Invited" role appear on your user in Discord.

You can start editing the page by modifying `pages/connect/[uid].tsx`. The page auto-updates as you edit the file.

## Webhook setup

- Signup for https://defender.openzeppelin.com
- Create a Sentinel:
  - Sentinel Type: Contract
  - Network: your network
  - Address: Contract's address
  - ABI: Contract's ABI
- Add a Webhook
  - Subscribe to "Transfer" event
  - Add link to your local running service
    - example: https://37ec-185-168-41-140.eu.ngrok.io/api/webhooks/nft-transfer
- Use Logs function to see if events are being tracked

## Learn More

To learn more about this stack, take a look at the following resources:

- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Next.js Documentation](https://nextjs.org/docs) - Learn how to build a Next.js application.

You can check out [the RainbowKit GitHub repository](https://github.com/rainbow-me/rainbowkit) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
