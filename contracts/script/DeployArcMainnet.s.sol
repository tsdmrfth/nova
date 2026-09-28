// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {NovaDemoPool} from "../src/NovaDemoPool.sol";
import {NovaSignal} from "../src/NovaSignal.sol";

/// @notice Arc mainnet deploy. Addresses come from the environment.
///         Do not commit private keys. Broadcast with forge's `--private-key` or a keystore.
///         Chain id 5042 is required. Testnet-only does not satisfy the Microgrant submit.
contract DeployArcMainnet is Script {
    /// @dev Circle docs: ERC-20 USDC interface on Arc, 6 decimals. Public protocol address.
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    uint256 internal constant ARC_MAINNET_CHAIN_ID = 5042;

    function run() external {
        bool allowRehearsal = vm.envOr("ALLOW_NON_MAINNET", false);
        if (block.chainid != ARC_MAINNET_CHAIN_ID && !allowRehearsal) {
            revert("Arc mainnet chain id 5042 required; testnet-only is not a Microgrant deploy");
        }

        address usdc = vm.envOr("USDC_ADDRESS", ARC_USDC);
        address studio = vm.envAddress("STUDIO_ADDRESS");
        address novaWallet = vm.envAddress("NOVA_WALLET");
        uint256 cap = vm.envUint("SIGNAL_CAP_MICRO");
        address owner = vm.envAddress("OWNER_ADDRESS");
        address agent = vm.envAddress("SIGNAL_AGENT");

        vm.startBroadcast();
        NovaDemoPool pool = new NovaDemoPool(usdc, studio, owner);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        NovaSignal signalContract = new NovaSignal(address(pool), novaWallet, cap, owner, agents);
        pool.setSignal(address(signalContract));
        vm.stopBroadcast();

        console2.log("NovaDemoPool", address(pool));
        console2.log("NovaSignal", address(signalContract));
        console2.log("USDC", usdc);
        console2.log("NovaWallet", novaWallet);
        console2.log("chainId", block.chainid);
    }
}
