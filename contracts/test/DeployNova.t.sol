// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DeployNova} from "../script/DeployNova.s.sol";

contract DeployNovaTest is Test {
    function test_revertsWhenFinalOwnerIsZero() public {
        vm.setEnv("ALLOW_NON_MAINNET", "true");
        vm.setEnv("STUDIO_ADDRESS", "0x0000000000000000000000000000000000000001");
        vm.setEnv("NOVA_WALLET", "0x0000000000000000000000000000000000000002");
        vm.setEnv("SIGNAL_CAP_MICRO", "1000000");
        vm.setEnv("OWNER_ADDRESS", "0x0000000000000000000000000000000000000000");

        DeployNova deploy = new DeployNova();
        vm.expectRevert(bytes("OWNER_ADDRESS is the zero address"));
        deploy.run();
    }
}
