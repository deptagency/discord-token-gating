// migrations/2_deploy_invite.js
const DiscordInvite = artifacts.require('DiscordInvite');

module.exports = async function (deployer) {
  await deployer.deploy(DiscordInvite);
};