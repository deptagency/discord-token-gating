/*
 * Can use following script to mint tokens for given address
 * From within solidity directory, specify whether dev or rinkeby network
 * npx truffle exec --network development ./scripts/mint.js
 */
const readlineSync = require("readline-sync");
module.exports = async function main(callback) {
  try {
    const DiscordInvite = artifacts.require("DiscordInvite");
    const invite = await DiscordInvite.deployed();
    const address = readlineSync.question(
      "What address should we mint this token to? "
    );

    if (readlineSync.keyInYN(`Mint token to ${address}?`)) {
      // 'Y' key was pressed.
      console.log("Minting now...")
      const tx = await invite.safeMint(address);
      console.log("Minted token", tx);
    } else {
      console.log("Aborting...");
    }

    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
};
