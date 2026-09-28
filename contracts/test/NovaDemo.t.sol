// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {BuySplit} from "../src/BuySplit.sol";
import {NovaDemoPool} from "../src/NovaDemoPool.sol";
import {NovaSignal} from "../src/NovaSignal.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external virtual returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract ReenterOnPull is MockUSDC {
    NovaDemoPool public pool;
    bool public armed;

    function setPool(address next) external {
        pool = NovaDemoPool(next);
    }

    function arm() external {
        armed = true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        if (armed) {
            armed = false;
            pool.buyExtraInfluence(1);
        }
        return true;
    }
}

contract NovaDemoTest is Test {
    MockUSDC internal usdc;
    NovaDemoPool internal pool;
    NovaSignal internal signalContract;

    address internal owner = makeAddr("owner");
    address internal studio = makeAddr("studio");
    address internal novaWallet = makeAddr("nova");
    address internal agent = makeAddr("agent");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant CAP = 1_000_000; // 1 USDC hard cap

    function setUp() public {
        usdc = new MockUSDC();
        pool = new NovaDemoPool(address(usdc), studio, owner);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        signalContract = new NovaSignal(address(pool), novaWallet, CAP, owner, agents);
        vm.prank(owner);
        pool.setSignal(address(signalContract));
        usdc.mint(buyer, 1_000_000_000);
        vm.prank(buyer);
        usdc.approve(address(pool), type(uint256).max);
    }

    function test_bpsAre90_8_2AndDayStays90_10() public pure {
        assertEq(BuySplit.PRIZE_BPS, 9_000);
        assertEq(BuySplit.STUDIO_NET_BPS, 800);
        assertEq(BuySplit.NOVA_BUDGET_BPS, 200);
        assertEq(BuySplit.PRIZE_BPS + BuySplit.STUDIO_NET_BPS + BuySplit.NOVA_BUDGET_BPS, BuySplit.BPS);
        assertEq(BuySplit.DAY_PAID_BPS, 9_000);
        assertEq(BuySplit.DAY_FREE_BPS, 1_000);
        assertEq(BuySplit.DAY_PAID_BPS + BuySplit.DAY_FREE_BPS, BuySplit.BPS);
    }

    function test_sparkAndPulseQuotes() public pure {
        (uint256 prize, uint256 studioNet, uint256 budget) = BuySplit.splitGross(1_000_000);
        assertEq(prize, 900_000);
        assertEq(studioNet, 80_000);
        assertEq(budget, 20_000);

        (prize, studioNet, budget) = BuySplit.splitGross(5_000_000);
        assertEq(prize, 4_500_000);
        assertEq(studioNet, 400_000);
        assertEq(budget, 100_000);
    }

    function test_dustStaysInPrize() public pure {
        (uint256 prize, uint256 studioNet, uint256 budget) = BuySplit.splitGross(1);
        assertEq(studioNet, 0);
        assertEq(budget, 0);
        assertEq(prize, 1);
    }

    function testFuzz_splitConservesGross(uint256 gross) public pure {
        gross = bound(gross, 0, type(uint128).max);
        (uint256 prize, uint256 studioNet, uint256 budget) = BuySplit.splitGross(gross);
        assertEq(prize + studioNet + budget, gross);
        assertEq(studioNet, (gross * 800) / 10_000);
        assertEq(budget, (gross * 200) / 10_000);
        assertGe(prize, (gross * 9_000) / 10_000);
    }

    function testFuzz_dayBucketsStay90_10(uint256 prize) public pure {
        prize = bound(prize, 0, type(uint128).max);
        (uint256 paid, uint256 freeBucket) = BuySplit.splitDay(prize);
        assertEq(paid + freeBucket, prize);
        assertEq(paid, (prize * 9_000) / 10_000);
        assertEq(freeBucket, prize - paid);
    }

    function test_buySparkCreditsLedger() public {
        vm.prank(buyer);
        uint256 extra = pool.buyExtraInfluence(1);
        assertEq(extra, 10);
        assertEq(pool.gross(), 1_000_000);
        assertEq(pool.prizePool(), 900_000);
        assertEq(pool.studioNet(), 80_000);
        assertEq(pool.novaBudget(), 20_000);
        assertTrue(pool.conserved());
        assertEq(usdc.balanceOf(address(pool)), 1_000_000);
    }

    function test_workedExample20Spark8Pulse() public {
        for (uint256 i = 0; i < 20; i++) {
            address payer = address(uint160(0xA000 + i));
            usdc.mint(payer, 1_000_000);
            vm.startPrank(payer);
            usdc.approve(address(pool), 1_000_000);
            pool.buyExtraInfluence(1);
            vm.stopPrank();
        }
        for (uint256 i = 0; i < 8; i++) {
            address payer = address(uint160(0xB000 + i));
            usdc.mint(payer, 5_000_000);
            vm.startPrank(payer);
            usdc.approve(address(pool), 5_000_000);
            pool.buyExtraInfluence(2);
            vm.stopPrank();
        }

        assertEq(pool.gross(), 60_000_000);
        assertEq(pool.prizePool(), 54_000_000);
        assertEq(pool.studioNet(), 4_800_000);
        assertEq(pool.novaBudget(), 1_200_000);
        assertTrue(pool.conserved());

        vm.prank(owner);
        pool.settleDay();
        (uint256 paid, uint256 freeBucket, uint256 prize, bool settled) = pool.dayBuckets(1);
        assertTrue(settled);
        assertEq(prize, 54_000_000);
        assertEq(paid, 48_600_000);
        assertEq(freeBucket, 5_400_000);
        assertEq(paid + freeBucket, prize);
        assertEq(usdc.balanceOf(address(pool)), 60_000_000);
        assertEq(pool.prizePool(), 54_000_000);
    }

    function test_dailyCap() public {
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(buyer);
            pool.buyExtraInfluence(1);
        }
        vm.expectRevert(NovaDemoPool.DailyCapExceeded.selector);
        vm.prank(buyer);
        pool.buyExtraInfluence(1);

        address other = makeAddr("other");
        usdc.mint(other, 20_000_000);
        vm.startPrank(other);
        usdc.approve(address(pool), type(uint256).max);
        pool.buyExtraInfluence(2);
        pool.buyExtraInfluence(2);
        vm.expectRevert(NovaDemoPool.DailyCapExceeded.selector);
        pool.buyExtraInfluence(2);
        vm.stopPrank();
    }

    function test_unknownPackAndNativeSendRevert() public {
        vm.expectRevert(NovaDemoPool.UnknownPack.selector);
        vm.prank(buyer);
        pool.buyExtraInfluence(0);

        vm.deal(address(this), 1 ether);
        (bool ok,) = address(pool).call{value: 1}("");
        assertFalse(ok);
    }

    function test_strayTokenDoesNotTopUpPrize() public {
        vm.prank(buyer);
        pool.buyExtraInfluence(1);
        uint256 prize = pool.prizePool();
        usdc.mint(address(pool), 5_000_000);
        assertEq(pool.prizePool(), prize);
        assertTrue(pool.conserved());
    }

    function test_signalSpendsOnlySettledBudget() public {
        vm.prank(buyer);
        pool.buyExtraInfluence(2);
        uint256 prize = pool.prizePool();
        uint256 studioNet = pool.studioNet();

        vm.expectRevert(NovaDemoPool.BudgetExceeded.selector);
        vm.prank(agent);
        signalContract.signal(1);

        vm.prank(owner);
        pool.settleDay();

        vm.prank(agent);
        signalContract.signal(100_000);

        assertEq(usdc.balanceOf(novaWallet), 100_000);
        assertEq(pool.novaBudget(), 0);
        assertEq(pool.novaBudgetSpent(), 100_000);
        assertEq(pool.prizePool(), prize);
        assertEq(pool.studioNet(), studioNet);
        assertEq(usdc.balanceOf(address(pool)), prize + studioNet);
        assertTrue(pool.conserved());
        assertEq(signalContract.totalSignaled(), 100_000);
    }

    function test_signalRejectsStrangerCapAndOverBudget() public {
        vm.prank(buyer);
        pool.buyExtraInfluence(1);
        vm.prank(owner);
        pool.settleDay();

        vm.expectRevert(NovaSignal.NotAllowlisted.selector);
        vm.prank(stranger);
        signalContract.signal(1);

        vm.expectRevert(NovaDemoPool.BudgetExceeded.selector);
        vm.prank(agent);
        signalContract.signal(20_001);

        vm.prank(agent);
        signalContract.signal(20_000);
        assertEq(pool.prizePool(), 900_000);
    }

    function test_capBlocksSecondSignalEvenWhenBudgetRemains() public {
        MockUSDC token = new MockUSDC();
        NovaDemoPool local = new NovaDemoPool(address(token), studio, owner);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        NovaSignal localSignal = new NovaSignal(address(local), novaWallet, 50_000, owner, agents);
        vm.prank(owner);
        local.setSignal(address(localSignal));

        token.mint(buyer, 10_000_000);
        vm.startPrank(buyer);
        token.approve(address(local), type(uint256).max);
        for (uint256 i = 0; i < 10; i++) {
            local.buyExtraInfluence(1);
        }
        vm.stopPrank();

        vm.prank(owner);
        local.settleDay();
        uint256 prize = local.prizePool();

        vm.prank(agent);
        localSignal.signal(50_000);
        assertEq(local.novaBudget(), 150_000);
        assertEq(local.prizePool(), prize);

        vm.expectRevert(NovaSignal.CapExceeded.selector);
        vm.prank(agent);
        localSignal.signal(1);
        assertEq(local.prizePool(), prize);
    }

    function test_unsettledDayBudgetIsNotSpendable() public {
        vm.prank(buyer);
        pool.buyExtraInfluence(1);
        vm.prank(owner);
        pool.settleDay();
        vm.prank(owner);
        pool.openNextDay();

        vm.prank(buyer);
        pool.buyExtraInfluence(1);

        vm.prank(agent);
        signalContract.signal(20_000);
        assertEq(pool.novaBudget(), 20_000);
        assertEq(pool.spendableNovaBudget(), 0);

        vm.expectRevert(NovaDemoPool.BudgetExceeded.selector);
        vm.prank(agent);
        signalContract.signal(1);

        vm.prank(owner);
        pool.settleDay();
        uint256 prize = pool.prizePool();
        vm.prank(agent);
        signalContract.signal(20_000);
        assertEq(pool.prizePool(), prize);
        assertEq(pool.novaBudget(), 0);
    }

    function test_studioWithdrawLeavesPrize() public {
        vm.prank(buyer);
        pool.buyExtraInfluence(1);
        uint256 prize = pool.prizePool();
        uint256 budget = pool.novaBudget();

        vm.expectRevert(NovaDemoPool.NotStudio.selector);
        vm.prank(owner);
        pool.withdrawStudioNet(1);

        vm.prank(studio);
        pool.withdrawStudioNet(80_000);
        assertEq(usdc.balanceOf(studio), 80_000);
        assertEq(pool.studioNet(), 0);
        assertEq(pool.prizePool(), prize);
        assertEq(pool.novaBudget(), budget);
        assertTrue(pool.conserved());
    }

    function test_signalDestinationIsTheNovaWalletOnly() public {
        address rotated = makeAddr("rotated");
        vm.prank(owner);
        signalContract.setNovaWallet(rotated);

        vm.prank(buyer);
        pool.buyExtraInfluence(1);
        vm.prank(owner);
        pool.settleDay();
        vm.prank(agent);
        signalContract.signal(20_000);

        assertEq(usdc.balanceOf(rotated), 20_000);
        assertEq(usdc.balanceOf(novaWallet), 0);
        assertEq(pool.prizePool(), 900_000);
    }

    function test_allowlistAndZeroWallet() public {
        vm.expectRevert(NovaSignal.NotOwner.selector);
        vm.prank(stranger);
        signalContract.setAllowlist(stranger, true);

        vm.prank(owner);
        signalContract.setAllowlist(stranger, true);
        assertTrue(signalContract.allowlist(stranger));

        vm.expectRevert(NovaSignal.ZeroAddress.selector);
        vm.prank(owner);
        signalContract.setNovaWallet(address(0));
    }

    function test_reentrancyOnBuyReverts() public {
        ReenterOnPull evil = new ReenterOnPull();
        NovaDemoPool trapped = new NovaDemoPool(address(evil), studio, owner);
        evil.setPool(address(trapped));
        evil.mint(buyer, 5_000_000);
        vm.startPrank(buyer);
        evil.approve(address(trapped), type(uint256).max);
        evil.arm();
        vm.expectRevert(NovaDemoPool.TransferFailed.selector);
        trapped.buyExtraInfluence(1);
        vm.stopPrank();
        assertEq(trapped.gross(), 0);
        assertEq(trapped.prizePool(), 0);
    }

    function test_setSignalOnce() public {
        NovaDemoPool fresh = new NovaDemoPool(address(usdc), studio, owner);
        vm.expectRevert(NovaDemoPool.NotOwner.selector);
        vm.prank(stranger);
        fresh.setSignal(address(signalContract));

        vm.prank(owner);
        fresh.setSignal(address(signalContract));
        vm.expectRevert(NovaDemoPool.SignalLocked.selector);
        vm.prank(owner);
        fresh.setSignal(address(0x1234));
    }

    function testFuzz_buySequenceConserves(uint8 seed) public {
        uint256 n = (uint256(seed) % 8) + 1;
        for (uint256 i = 0; i < n; i++) {
            uint8 packId = ((uint256(seed) + i) % 2 == 0) ? 1 : 2;
            uint256 price = packId == 1 ? 1_000_000 : 5_000_000;
            if (pool.spentOnDay(pool.dayId(), buyer) + price > pool.MAX_DAILY_BUY()) break;
            vm.prank(buyer);
            pool.buyExtraInfluence(packId);
            assertTrue(pool.conserved());
            assertEq(pool.prizePool() + pool.studioNet() + pool.novaBudget(), pool.gross());
        }
    }
}
