// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {NovaPool} from "../src/NovaPool.sol";
import {NovaSignal} from "../src/NovaSignal.sol";

/// @notice Deploys NovaPool + NovaSignal on Arc. Addresses come from the environment.
///         Do not commit private keys. Broadcast with a Foundry keystore (`--account`).
///         Mainnet (5042) by default; testnet or anvil only with ALLOW_NON_MAINNET=true.
///
///         The broadcaster owns both contracts while it wires them, then starts a two-step
///         hand-over to OWNER_ADDRESS (meant to be a Safe). The new owner must call
///         `acceptOwnership()` on both contracts before it controls them.
contract DeployNova is Script {
    /// @dev Circle docs: ERC-20 USDC interface on Arc, 6 decimals. Public protocol address.
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    uint256 internal constant ARC_MAINNET_CHAIN_ID = 5042;

    function run() external {
        bool allowRehearsal = vm.envOr("ALLOW_NON_MAINNET", false);
        if (block.chainid != ARC_MAINNET_CHAIN_ID && !allowRehearsal) {
            revert("Arc mainnet chain id 5042 required; set ALLOW_NON_MAINNET=true for testnet");
        }

        address usdc = vm.envOr("USDC_ADDRESS", ARC_USDC);
        address studio = vm.envAddress("STUDIO_ADDRESS");
        address novaWallet = vm.envAddress("NOVA_WALLET");
        uint256 cap = vm.envUint("SIGNAL_CAP_MICRO");
        address owner = vm.envAddress("OWNER_ADDRESS");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        address agent = vm.envAddress("SIGNAL_AGENT");
        uint64 firstClose = uint64(vm.envOr("FIRST_DAY_CLOSES_AT", uint256(0)));

        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();
        NovaPool pool = new NovaPool(usdc, studio, deployer, operator);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        NovaSignal signalContract = new NovaSignal(address(pool), novaWallet, cap, deployer, agents);
        pool.setSignal(address(signalContract));
        if (firstClose != 0) pool.setDayClose(firstClose);
        if (owner != deployer) {
            pool.transferOwnership(owner);
            signalContract.transferOwnership(owner);
        }
        vm.stopBroadcast();

        console2.log("NovaPool", address(pool));
        console2.log("NovaSignal", address(signalContract));
        console2.log("USDC", usdc);
        console2.log("NovaWallet", novaWallet);
        console2.log("Operator", operator);
        console2.log("chainId", block.chainid);
        if (owner != deployer) {
            console2.log("Pending owner (must acceptOwnership on both)", owner);
        } else {
            console2.log("Owner", owner);
        }
    }
}
