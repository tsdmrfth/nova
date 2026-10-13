// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {NovaPool} from "../src/NovaPool.sol";
import {NovaSignal} from "../src/NovaSignal.sol";
import {MockUSDC} from "./helpers/MockUSDC.sol";

/// @notice Drives the pool through random days: buys, votes, settles, claims, studio and
///         budget withdrawals, and pauses. Each action skips itself when the pool would
///         reject it, so every run reaches deep, valid state.
contract PoolHandler is Test {
    NovaPool internal pool;
    NovaSignal internal signalContract;
    MockUSDC internal usdc;
    address internal owner;
    address internal operator;
    address internal studio;
    address internal agent;
    address[] internal actors;

    /// Prize paid out per day, summed by the handler.
    mapping(uint256 => uint256) public claimedOn;

    constructor(
        NovaPool pool_,
        NovaSignal signal_,
        MockUSDC usdc_,
        address owner_,
        address operator_,
        address studio_,
        address agent_
    ) {
        pool = pool_;
        signalContract = signal_;
        usdc = usdc_;
        owner = owner_;
        operator = operator_;
        studio = studio_;
        agent = agent_;
        for (uint256 i = 0; i < 5; i++) {
            address actor = makeAddr(string.concat("actor", vm.toString(i)));
            usdc.mint(actor, 1_000_000_000);
            vm.prank(actor);
            usdc.approve(address(pool), type(uint256).max);
            actors.push(actor);
        }
    }

    function buy(uint256 actorSeed, bool pulse) external {
        if (pool.paused() || !pool.dayOpen()) return;
        address actor = actors[actorSeed % actors.length];
        uint256 price = pulse ? pool.PULSE_PRICE() : pool.SPARK_PRICE();
        if (pool.spentOnDay(pool.dayId(), actor) + price > pool.MAX_DAILY_BUY()) return;
        (,,,, bool voted,) = pool.entries(pool.dayId(), actor);
        if (voted) return;
        uint8 pack = pulse ? pool.PACK_PULSE() : pool.PACK_SPARK();
        vm.prank(actor);
        pool.buyExtraInfluence(pack);
    }

    function vote(uint256 actorSeed, uint8 option, uint256 free, uint256 extra) external {
        if (pool.paused() || !pool.dayOpen()) return;
        address actor = actors[actorSeed % actors.length];
        (uint64 bought,,,, bool voted,) = pool.entries(pool.dayId(), actor);
        if (voted) return;
        free = bound(free, 0, pool.FREE_DAILY_GRANT());
        extra = bound(extra, 0, bought);
        if (free + extra == 0) return;
        option %= pool.OPTION_COUNT();
        vm.prank(actor);
        pool.castVote(option, free, extra);
    }

    function settle() external {
        if (!pool.dayOpen()) return;
        vm.prank(operator);
        pool.settleDay();
    }

    function openNext() external {
        if (pool.dayOpen()) return;
        vm.prank(operator);
        pool.openNextDay(0);
    }

    function claim(uint256 actorSeed, uint256 daySeed) external {
        address actor = actors[actorSeed % actors.length];
        uint256 id = bound(daySeed, 1, pool.dayId());
        (uint256 paid, uint256 free) = pool.claimable(id, actor);
        if (paid + free == 0) return;
        vm.prank(actor);
        claimedOn[id] += pool.claim(id);
    }

    function withdrawStudio(uint256 amount) external {
        uint256 available = pool.studioNet();
        if (available == 0) return;
        vm.prank(studio);
        pool.withdrawStudioNet(bound(amount, 1, available));
    }

    function signal(uint256 amount) external {
        (,,, uint256 remainingCap) = signalContract.snapshot();
        uint256 spendable = pool.spendableNovaBudget();
        uint256 max = spendable < remainingCap ? spendable : remainingCap;
        if (max == 0) return;
        vm.prank(agent);
        signalContract.signal(bound(amount, 1, max));
    }

    function togglePause(bool on) external {
        vm.prank(on ? operator : owner);
        if (on) pool.pause();
        else pool.unpause();
    }
}

contract NovaPoolInvariantTest is Test {
    MockUSDC internal usdc;
    NovaPool internal pool;
    NovaSignal internal signalContract;
    PoolHandler internal handler;

    function setUp() public {
        address owner = makeAddr("owner");
        address operator = makeAddr("operator");
        address studio = makeAddr("studio");
        address agent = makeAddr("agent");
        usdc = new MockUSDC();
        pool = new NovaPool(address(usdc), studio, owner, operator);
        address[] memory agents = new address[](1);
        agents[0] = agent;
        signalContract = new NovaSignal(address(pool), makeAddr("nova"), 50_000_000, owner, agents);
        vm.prank(owner);
        pool.setSignal(address(signalContract));
        handler = new PoolHandler(pool, signalContract, usdc, owner, operator, studio, agent);
        targetContract(address(handler));
    }

    /// Every micro-USDC that came in is in exactly one ledger bucket or already paid out.
    function invariant_ledgerConserved() public view {
        assertTrue(pool.conserved());
    }

    /// The pool always holds exactly what its open buckets owe.
    function invariant_solvent() public view {
        assertEq(usdc.balanceOf(address(pool)), pool.prizePool() + pool.studioNet() + pool.novaBudget());
    }

    function invariant_budgetSpendOnlyFromSettledDays() public view {
        assertLe(pool.spendableNovaBudget(), pool.novaBudget());
    }

    /// Winners of a day never take more than that day's pot minus what rolled forward.
    function invariant_claimsWithinDayPot() public view {
        uint256 last = pool.dayId();
        for (uint256 id = 1; id <= last; id++) {
            (uint256 paidBucket, uint256 freeBucket,, bool settled) = pool.dayBuckets(id);
            if (!settled) {
                assertEq(handler.claimedOn(id), 0);
                continue;
            }
            (,,,,,,,, uint256 rolledOut,,) = pool.days_(id);
            assertLe(handler.claimedOn(id) + rolledOut, paidBucket + freeBucket);
        }
    }
}
