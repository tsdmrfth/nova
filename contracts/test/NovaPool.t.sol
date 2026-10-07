// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {BuySplit} from "../src/BuySplit.sol";
import {NovaPool} from "../src/NovaPool.sol";
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

    function transfer(address to, uint256 amount) external virtual returns (bool) {
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
    NovaPool public pool;
    bool public armed;

    function setPool(address next) external {
        pool = NovaPool(next);
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

/// @dev Arc USDC reverts transfers to or from a blocklisted address.
contract BlocklistUSDC is MockUSDC {
    mapping(address => bool) public blocked;

    function setBlocked(address who, bool value) external {
        blocked[who] = value;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(!blocked[to] && !blocked[msg.sender], "blocklisted");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract NovaPoolTest is Test {
    MockUSDC internal usdc;
    NovaPool internal pool;
    NovaSignal internal signalContract;

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal studio = makeAddr("studio");
    address internal novaWallet = makeAddr("nova");
    address internal agent = makeAddr("agent");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant CAP = 1_000_000; // 1 USDC hard cap

    function setUp() public {
        usdc = new MockUSDC();
        pool = new NovaPool(address(usdc), studio, owner, operator);
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
        vm.expectRevert(NovaPool.DailyCapExceeded.selector);
        vm.prank(buyer);
        pool.buyExtraInfluence(1);

        address other = makeAddr("other");
        usdc.mint(other, 20_000_000);
        vm.startPrank(other);
        usdc.approve(address(pool), type(uint256).max);
        pool.buyExtraInfluence(2);
        pool.buyExtraInfluence(2);
        vm.expectRevert(NovaPool.DailyCapExceeded.selector);
        pool.buyExtraInfluence(2);
        vm.stopPrank();
    }

    function test_unknownPackAndNativeSendRevert() public {
        vm.expectRevert(NovaPool.UnknownPack.selector);
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

        vm.expectRevert(NovaPool.BudgetExceeded.selector);
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

        vm.expectRevert(NovaPool.BudgetExceeded.selector);
        vm.prank(agent);
        signalContract.signal(20_001);

        vm.prank(agent);
        signalContract.signal(20_000);
        assertEq(pool.prizePool(), 900_000);
    }

    function test_capBlocksSecondSignalEvenWhenBudgetRemains() public {
        MockUSDC token = new MockUSDC();
        NovaPool local = new NovaPool(address(token), studio, owner, operator);
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
        pool.openNextDay(0);

        vm.prank(buyer);
        pool.buyExtraInfluence(1);

        vm.prank(agent);
        signalContract.signal(20_000);
        assertEq(pool.novaBudget(), 20_000);
        assertEq(pool.spendableNovaBudget(), 0);

        vm.expectRevert(NovaPool.BudgetExceeded.selector);
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

        vm.expectRevert(NovaPool.NotStudio.selector);
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
        NovaPool trapped = new NovaPool(address(evil), studio, owner, operator);
        evil.setPool(address(trapped));
        evil.mint(buyer, 5_000_000);
        vm.startPrank(buyer);
        evil.approve(address(trapped), type(uint256).max);
        evil.arm();
        vm.expectRevert(NovaPool.TransferFailed.selector);
        trapped.buyExtraInfluence(1);
        vm.stopPrank();
        assertEq(trapped.gross(), 0);
        assertEq(trapped.prizePool(), 0);
    }

    function test_setSignalOnce() public {
        NovaPool fresh = new NovaPool(address(usdc), studio, owner, operator);
        vm.expectRevert(NovaPool.NotOwner.selector);
        vm.prank(stranger);
        fresh.setSignal(address(signalContract));

        vm.prank(owner);
        fresh.setSignal(address(signalContract));
        vm.expectRevert(NovaPool.SignalLocked.selector);
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

/// @notice Vote, onchain W*, claim, and rollover. Numbers mirror `@nova/shared` settleDay.
contract NovaGameTest is Test {
    MockUSDC internal usdc;
    NovaPool internal pool;
    NovaSignal internal signalContract;

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal studio = makeAddr("studio");
    address internal novaWallet = makeAddr("nova");
    address internal agent = makeAddr("agent");
    address internal stranger = makeAddr("stranger");

    uint8 internal constant A = 0;
    uint8 internal constant B = 1;
    uint8 internal constant C = 2;

    function setUp() public {
        usdc = new MockUSDC();
        pool = new NovaPool(address(usdc), studio, owner, operator);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        signalContract = new NovaSignal(address(pool), novaWallet, 1_000_000, owner, agents);
        vm.prank(owner);
        pool.setSignal(address(signalContract));
    }

    function _player(string memory name) internal returns (address who) {
        who = makeAddr(name);
        usdc.mint(who, 100_000_000);
        vm.prank(who);
        usdc.approve(address(pool), type(uint256).max);
    }

    function _buy(address who, uint8 packId) internal {
        vm.prank(who);
        pool.buyExtraInfluence(packId);
    }

    function _vote(address who, uint8 option, uint256 free, uint256 extra) internal {
        vm.prank(who);
        pool.castVote(option, free, extra);
    }

    function _settle() internal {
        vm.prank(operator);
        pool.settleDay();
    }

    function _entry(address who) internal view returns (uint64 bought, uint64 placed, uint8 free, uint8 option, bool voted, bool claimed) {
        return pool.entries(pool.dayId(), who);
    }

    function test_voteRecordsTalliesAndEntry() public {
        address p = _player("p");
        _buy(p, 1);
        _vote(p, B, 7, 10);

        (uint64 bought, uint64 placed, uint8 free, uint8 option, bool voted,) = _entry(p);
        assertEq(bought, 10);
        assertEq(placed, 10);
        assertEq(free, 7);
        assertEq(option, B);
        assertTrue(voted);
        (uint256[3] memory freeT, uint256[3] memory extraT) = pool.optionTallies(1);
        assertEq(freeT[B], 7);
        assertEq(extraT[B], 10);
        assertEq(freeT[A] + freeT[C] + extraT[A] + extraT[C], 0);
    }

    function test_voteGuards() public {
        address p = _player("p");
        vm.startPrank(p);
        vm.expectRevert(NovaPool.UnknownOption.selector);
        pool.castVote(3, 1, 0);
        vm.expectRevert(NovaPool.ZeroAmount.selector);
        pool.castVote(A, 0, 0);
        vm.expectRevert(NovaPool.FreeExceeded.selector);
        pool.castVote(A, 11, 0);
        vm.expectRevert(NovaPool.ExtraExceeded.selector);
        pool.castVote(A, 10, 1);
        pool.castVote(A, 10, 0);
        vm.expectRevert(NovaPool.AlreadyVoted.selector);
        pool.castVote(B, 1, 0);
        vm.stopPrank();

        _settle();
        address late = _player("late");
        vm.expectRevert(NovaPool.DayNotOpen.selector);
        vm.prank(late);
        pool.castVote(A, 1, 0);
    }

    function test_buyAfterVoteReverts() public {
        address p = _player("p");
        _vote(p, C, 10, 0);
        vm.expectRevert(NovaPool.PurchaseClosed.selector);
        _buy(p, 2);
        (uint64 bought, uint64 placed,,,,) = _entry(p);
        assertEq(bought, 0);
        assertEq(placed, 0);
    }

    function test_effectiveExtraCapsOnVote() public {
        address p = _player("p");
        _buy(p, 2);
        _buy(p, 2);
        _vote(p, C, 0, 110);
        (, uint256[3] memory extraT) = pool.optionTallies(1);
        assertEq(extraT[C], 100, "effective Extra caps at 100");
    }

    function test_goalRotationPicksFromFreeOnly() public {
        // Day 1 MOST, day 2 LEAST, day 3 MIDDLE. Free A 2 / B 5 / C 3; whale Extra on A.
        for (uint256 day = 1; day <= 3; day++) {
            address whale = _player(string.concat("whale", vm.toString(day)));
            _buy(whale, 2);
            _buy(whale, 2);
            _vote(whale, A, 0, 110);
            _vote(_player(string.concat("a", vm.toString(day))), A, 2, 0);
            _vote(_player(string.concat("b", vm.toString(day))), B, 5, 0);
            _vote(_player(string.concat("c", vm.toString(day))), C, 3, 0);
            uint8 expected = day == 1 ? B : day == 2 ? A : C;
            assertEq(pool.pickWinner(day), expected);
            _settle();
            (,,,,,,,,,, uint8 winner) = pool.days_(day);
            assertEq(winner, expected);
            vm.prank(owner);
            pool.openNextDay(0);
        }
    }

    function test_tiesBreakByOptionAscending() public {
        assertEq(pool.pickWinner(1), A, "all zero, MOST takes A");
        _vote(_player("b"), B, 4, 0);
        _vote(_player("c"), C, 4, 0);
        assertEq(pool.pickWinner(1), B);
    }

    address internal w40;
    address internal w30a;
    address internal w30b;
    address internal loser;
    address internal freeB1;
    address internal freeB2;

    function _seedClaimDay() internal {
        w40 = _player("w40");
        w30a = _player("w30a");
        w30b = _player("w30b");
        loser = _player("loser");
        freeB1 = _player("freeB1");
        freeB2 = _player("freeB2");
        // 40 Extra: 4 Spark. 30 Extra: 3 Spark each. Loser: 2 Pulse on A.
        for (uint256 i = 0; i < 4; i++) _buy(w40, 1);
        for (uint256 i = 0; i < 3; i++) {
            _buy(w30a, 1);
            _buy(w30b, 1);
        }
        _buy(loser, 2);
        _buy(loser, 2);
        _vote(w40, B, 0, 40);
        _vote(w30a, B, 0, 30);
        _vote(w30b, B, 0, 30);
        _vote(loser, A, 0, 110);
        _vote(freeB1, B, 10, 0);
        _vote(freeB2, B, 5, 0);
        _vote(_player("freeA"), A, 10, 0);
    }

    function _claimableTotal(address who) internal view returns (uint256) {
        (uint256 paid, uint256 free) = pool.claimable(1, who);
        return paid + free;
    }

    /// gross 4 + 3 + 3 + 10 = 20 USDC → prize 18 USDC → paid 16.2 / free 1.8.
    function test_claimSplitsLanesProRata() public {
        _seedClaimDay();
        assertEq(pool.prizePool(), 18_000_000);
        _settle();
        (uint256 paidBucket, uint256 freeBucket, uint256 pot, bool settled) = pool.dayBuckets(1);
        assertTrue(settled);
        assertEq(pot, 18_000_000);
        assertEq(paidBucket, 16_200_000);
        assertEq(freeBucket, 1_800_000);

        assertEq(_claimableTotal(w40), 6_480_000);
        assertEq(_claimableTotal(w30a), 4_860_000);
        assertEq(_claimableTotal(w30b), 4_860_000);
        assertEq(_claimableTotal(freeB1), 1_200_000);
        assertEq(_claimableTotal(freeB2), 600_000);
        assertEq(_claimableTotal(loser), 0);
    }

    function test_claimPaysOnceAndConserves() public {
        _seedClaimDay();
        _settle();
        uint256 before = usdc.balanceOf(w40);
        vm.prank(w40);
        assertEq(pool.claim(1), 6_480_000);
        assertEq(usdc.balanceOf(w40) - before, 6_480_000);
        assertEq(pool.prizePool(), 18_000_000 - 6_480_000);
        assertEq(pool.prizeClaimed(), 6_480_000);
        assertEq(_claimableTotal(w40), 0);
        assertTrue(pool.conserved());

        vm.expectRevert(NovaPool.AlreadyClaimed.selector);
        vm.prank(w40);
        pool.claim(1);
        vm.expectRevert(NovaPool.NothingToClaim.selector);
        vm.prank(loser);
        pool.claim(1);

        address[4] memory rest = [w30a, w30b, freeB1, freeB2];
        for (uint256 i = 0; i < rest.length; i++) {
            vm.prank(rest[i]);
            pool.claim(1);
        }
        assertEq(pool.prizePool(), 0, "exact split leaves no dust");
        assertTrue(pool.conserved());
    }

    function test_claimBeforeSettleOrForMissReverts() public {
        address p = _player("p");
        _vote(p, A, 10, 0);
        vm.expectRevert(NovaPool.NothingToClaim.selector);
        vm.prank(p);
        pool.claim(1);
    }

    function test_emptyLanesRollIntoNextDay() public {
        // Only Free votes on the winner: the paid bucket rolls.
        address buyer = _player("buyer");
        _buy(buyer, 1);
        _vote(buyer, A, 0, 10);
        address freeB = _player("freeB");
        _vote(freeB, B, 10, 0);
        _vote(_player("freeB2"), B, 10, 0);
        _settle();
        (,,,,,,,, uint256 rolledOut,, uint8 winner) = pool.days_(1);
        assertEq(winner, B);
        assertEq(rolledOut, 810_000, "90% of 0.9 USDC");

        vm.prank(owner);
        pool.openNextDay(0);
        (,,,,,,, uint256 rollover,,,) = pool.days_(2);
        assertEq(rollover, 810_000);

        // Day 2 is LEAST. Nobody votes; everything rolls again, nothing is lost.
        _settle();
        (uint256 paid2, uint256 free2, uint256 pot2,) = pool.dayBuckets(2);
        assertEq(pot2, 810_000);
        assertEq(paid2 + free2, 810_000);
        (,,,,,,,, uint256 rolled2,,) = pool.days_(2);
        assertEq(rolled2, 810_000);

        vm.prank(freeB);
        assertEq(pool.claim(1), 45_000, "half the 0.09 USDC free bucket");
        assertTrue(pool.conserved());
    }

    function test_closeTimeGatesVotingAndSettle() public {
        uint64 closesAt = uint64(block.timestamp + 1 hours);
        vm.expectRevert(NovaPool.NotOperator.selector);
        pool.setDayClose(closesAt);
        vm.prank(operator);
        pool.setDayClose(closesAt);

        address p = _player("p");
        _vote(p, A, 10, 0);
        vm.expectRevert(NovaPool.VotingStillOpen.selector);
        vm.prank(operator);
        pool.settleDay();

        vm.warp(closesAt);
        address late = _player("late");
        vm.expectRevert(NovaPool.VotingClosed.selector);
        vm.prank(late);
        pool.castVote(B, 1, 0);
        vm.expectRevert(NovaPool.VotingClosed.selector);
        _buy(p, 1);

        _settle();
        vm.expectRevert(NovaPool.BadCloseTime.selector);
        vm.prank(operator);
        pool.openNextDay(uint64(block.timestamp));
        vm.prank(operator);
        pool.openNextDay(uint64(block.timestamp + 1 days));
        assertEq(pool.dayId(), 2);
    }

    function test_signalCannotTouchClaimablePrize() public {
        address p = _player("p");
        _buy(p, 2);
        _vote(p, A, 10, 55);
        _settle();
        uint256 prize = pool.prizePool();
        vm.prank(agent);
        signalContract.signal(100_000);
        assertEq(pool.prizePool(), prize);
        vm.prank(p);
        assertEq(pool.claim(1), prize);
        assertEq(pool.prizePool(), 0);
        assertTrue(pool.conserved());
    }

    function testFuzz_claimsNeverExceedPot(uint8 seed) public {
        uint256 players = (uint256(seed) % 6) + 2;
        address[] memory list = new address[](players);
        for (uint256 i = 0; i < players; i++) {
            list[i] = _player(string.concat("f", vm.toString(i)));
            uint256 r = uint256(keccak256(abi.encode(seed, i)));
            uint8 pack = r % 3 == 0 ? 2 : 1;
            _buy(list[i], pack);
            _vote(list[i], uint8(r % 3), (r >> 8) % 11, pack == 1 ? 10 : 55);
        }
        uint256 pot = pool.prizePool();
        _settle();
        uint256 paidOut;
        for (uint256 i = 0; i < players; i++) {
            (uint256 paid, uint256 free) = pool.claimable(1, list[i]);
            if (paid + free == 0) continue;
            vm.prank(list[i]);
            paidOut += pool.claim(1);
        }
        (,,,,,,,, uint256 rolledOut,,) = pool.days_(1);
        assertLe(paidOut + rolledOut, pot);
        assertEq(pool.prizePool(), pot - paidOut);
        assertTrue(pool.conserved());
    }

    function test_operatorRunsDayLoopOwnerHoldsAdmin() public {
        vm.expectRevert(NovaPool.NotOperator.selector);
        vm.prank(stranger);
        pool.settleDay();
        vm.expectRevert(NovaPool.NotOwner.selector);
        vm.prank(operator);
        pool.setOperator(stranger);
        vm.expectRevert(NovaPool.NotOwner.selector);
        vm.prank(operator);
        pool.unpause();

        address next = makeAddr("next operator");
        vm.prank(owner);
        pool.setOperator(next);
        assertEq(pool.operator(), next);
        vm.expectRevert(NovaPool.NotOperator.selector);
        vm.prank(operator);
        pool.settleDay();

        // The owner can always stand in for the operator.
        vm.prank(owner);
        pool.settleDay();
        vm.prank(next);
        pool.openNextDay(0);
        assertEq(pool.dayId(), 2);
    }

    function test_pauseStopsBuysAndVotesButNotPayouts() public {
        address p = _player("p");
        _buy(p, 2);
        _vote(p, A, 10, 55);
        _settle();
        vm.prank(operator);
        pool.openNextDay(0);

        vm.expectRevert(NovaPool.NotOperator.selector);
        vm.prank(stranger);
        pool.pause();
        vm.prank(operator);
        pool.pause();
        assertTrue(pool.paused());

        vm.expectRevert(NovaPool.GamePaused.selector);
        _buy(p, 1);
        vm.expectRevert(NovaPool.GamePaused.selector);
        _vote(p, A, 1, 0);

        vm.prank(p);
        assertGt(pool.claim(1), 0);
        vm.prank(studio);
        pool.withdrawStudioNet(1);
        vm.prank(agent);
        signalContract.signal(1);
        _settle();
        assertTrue(pool.conserved());

        vm.prank(owner);
        pool.openNextDay(0);
        vm.prank(owner);
        pool.unpause();
        _buy(p, 1);
        assertEq(pool.spentOnDay(3, p), 1_000_000);
    }

    function test_ownershipMovesInTwoSteps() public {
        address safe = makeAddr("safe");
        vm.prank(owner);
        pool.transferOwnership(safe);
        assertEq(pool.owner(), owner, "still the old owner until accepted");
        assertEq(pool.pendingOwner(), safe);

        vm.expectRevert(NovaPool.NotPendingOwner.selector);
        vm.prank(stranger);
        pool.acceptOwnership();

        vm.prank(safe);
        pool.acceptOwnership();
        assertEq(pool.owner(), safe);
        assertEq(pool.pendingOwner(), address(0));
        vm.expectRevert(NovaPool.NotOwner.selector);
        vm.prank(owner);
        pool.setOperator(stranger);

        // address(0) cancels a pending hand-over.
        vm.prank(safe);
        pool.transferOwnership(stranger);
        vm.prank(safe);
        pool.transferOwnership(address(0));
        vm.expectRevert(NovaPool.NotPendingOwner.selector);
        vm.prank(stranger);
        pool.acceptOwnership();

        vm.prank(owner);
        signalContract.transferOwnership(safe);
        vm.expectRevert(NovaSignal.NotPendingOwner.selector);
        vm.prank(stranger);
        signalContract.acceptOwnership();
        vm.prank(safe);
        signalContract.acceptOwnership();
        assertEq(signalContract.owner(), safe);
    }

    /// Arc's USDC blocklist reverts a payout to a blocked winner. That claim fails and stays
    /// unclaimed; every other winner still claims.
    function test_blockedWinnerDoesNotBlockOthers() public {
        BlocklistUSDC token = new BlocklistUSDC();
        NovaPool local = new NovaPool(address(token), studio, owner, operator);
        address blockedWinner = makeAddr("blocked");
        address cleanWinner = makeAddr("clean");
        address[2] memory players = [blockedWinner, cleanWinner];
        for (uint256 i = 0; i < 2; i++) {
            token.mint(players[i], 10_000_000);
            vm.startPrank(players[i]);
            token.approve(address(local), type(uint256).max);
            local.buyExtraInfluence(1);
            local.castVote(A, 10, 10);
            vm.stopPrank();
        }
        vm.prank(operator);
        local.settleDay();
        token.setBlocked(blockedWinner, true);

        vm.expectRevert(NovaPool.TransferFailed.selector);
        vm.prank(blockedWinner);
        local.claim(1);
        (,,,,, bool claimed) = local.entries(1, blockedWinner);
        assertFalse(claimed);

        vm.prank(cleanWinner);
        assertEq(local.claim(1), 900_000);
        assertEq(local.prizePool(), 900_000, "blocked share stays in the pool");
        assertTrue(local.conserved());
    }
}
