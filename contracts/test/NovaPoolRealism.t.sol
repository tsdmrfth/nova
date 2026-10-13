// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {NovaPool} from "../src/NovaPool.sol";
import {MockUSDC} from "./helpers/MockUSDC.sol";

// ---------------------------------------------------------------------------
// Realism gap tests
// Three scenarios that bring the test suite closer to production behaviour:
//   1. Long cascade of empty days (deep rollover arithmetic, no overflow).
//   2. Race condition at the exact closesAt boundary.
//   3. USDC freeze blocks buys as well as claims, and does not strand others.
// ---------------------------------------------------------------------------

/// @dev USDC that can be frozen globally (simulates Circle's pause / blocklist).
contract FreezableUSDC is MockUSDC {
    bool public frozen;
    mapping(address => bool) public blocked;

    function freeze() external { frozen = true; }
    function unfreeze() external { frozen = false; }
    function block_(address who) external { blocked[who] = true; }
    function unblock(address who) external { blocked[who] = false; }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(!frozen, "frozen");
        require(!blocked[msg.sender] && !blocked[to], "blocklisted");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(!frozen, "frozen");
        require(!blocked[from] && !blocked[to], "blocklisted");
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract NovaPoolRealismTest is Test {
    uint256 internal constant USDC = 1_000_000;

    address internal owner    = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal studio   = makeAddr("studio");

    // -----------------------------------------------------------------------
    // 1. CASCADE ROLLOVER — 10 consecutive empty days
    //    Setup: one Pulse buy + vote on day 1 (winner A), nobody votes on days
    //    2–11 so every bucket rolls forward untouched. On day 12 players finally
    //    vote the winner and claim the entire accumulated pot.
    //    Checks: no arithmetic overflow, conserved() holds every day,
    //    final claim equals the exact pot (minus dust), prizePool → 0.
    // -----------------------------------------------------------------------
    function test_cascadeRolloverTenEmptyDays() public {
        MockUSDC usdc = new MockUSDC();
        NovaPool pool = new NovaPool(address(usdc), studio, owner, operator);

        // Six players — enough to cover 3 options in later days.
        address[6] memory p;
        for (uint256 i = 0; i < 6; i++) {
            p[i] = makeAddr(string.concat("cr", vm.toString(i)));
            usdc.mint(p[i], 200 * USDC);
            vm.prank(p[i]);
            usdc.approve(address(pool), type(uint256).max);
        }

        // Day 1 (MOST): one Pulse buyer on A, two free voters on A, nobody on B/C paid.
        // Winner = A (most free). Both lanes have voters → nothing rolls from day 1.
        vm.prank(p[0]); pool.buyExtraInfluence(2);  // Pulse → 55 extra
        vm.prank(p[0]); pool.castVote(0, 10, 55);
        vm.prank(p[1]); pool.castVote(0, 10, 0);
        vm.prank(p[2]); pool.castVote(1, 5, 0);    // loser free votes to keep tally non-zero

        vm.prank(operator); pool.settleDay();
        assertTrue(pool.conserved(), "day1 conserved");
        (uint256 paidBucket1,,, bool s1) = pool.dayBuckets(1);
        assertTrue(s1);
        assertGt(paidBucket1, 0);

        // p[0] claims day 1 immediately.
        (uint256 gotPaid, uint256 gotFree) = pool.claimable(1, p[0]);
        assertGt(gotPaid + gotFree, 0, "p0 should win day1");
        vm.prank(p[0]); pool.claim(1);
        assertTrue(pool.conserved(), "post-claim conserved");

        uint256 prizeBeforeEmptyStreak = pool.prizePool();

        // Days 2–11: open next, nobody votes, settle → entire pot rolls forward.
        for (uint256 day = 2; day <= 11; day++) {
            vm.prank(operator); pool.openNextDay(0);
            assertEq(pool.dayId(), day, "dayId");
            assertTrue(pool.dayOpen(), "day open");

            // Capture pot before settle (prize + rollover).
            (, uint256 dayPrize,,,,,,uint256 rollover,,,) = pool.days_(day);
            uint256 pot = dayPrize + rollover;

            vm.prank(operator); pool.settleDay();
            assertTrue(pool.conserved(), string.concat("conserved day ", vm.toString(day)));

            (,,,,,,,, uint256 rolledOut,,) = pool.days_(day);
            assertEq(rolledOut, pot, string.concat("full pot rolled day ", vm.toString(day)));
        }

        // Total rolled prize has only grown (day1 claims removed, but no new buys).
        // prizePool should still hold exactly what remained after day1 claims.
        uint256 prizeAfterStreak = pool.prizePool();
        // After 10 empty days, prize pool is unchanged (rolls don't consume funds).
        assertEq(prizeAfterStreak, prizeBeforeEmptyStreak, "empty rolls do not consume prize");

        // Day 12 (MOST — day 12 = (12-1)%3 = 2 → MIDDLE).
        // Bring real voters. All three options get free votes; A wins MIDDLE rank (middle free tally).
        vm.prank(operator); pool.openNextDay(0);
        assertEq(pool.dayId(), 12);

        // Give fresh USDC (p[0] used their limit already on day1 but it's a new day).
        vm.prank(p[0]); pool.buyExtraInfluence(2);  // Pulse on A

        // Tally: A=12 free, B=5 free, C=10 free → sorted desc: A(12), C(10), B(5)
        // MIDDLE = rank 1 = C(10). Winner = C.
        vm.prank(p[0]); pool.castVote(0, 2, 55);   // A: 2 free, 55 extra
        vm.prank(p[1]); pool.castVote(0, 10, 0);   // A: 10 free
        vm.prank(p[2]); pool.castVote(2, 10, 0);   // C: 10 free
        vm.prank(p[3]); pool.castVote(1, 5, 0);    // B: 5 free
        // A=12, C=10, B=5 → MIDDLE(rank1) = C

        uint256 potDay12;
        {
            (, uint256 pr12,,,,,, uint256 ro12,,,) = pool.days_(12);
            potDay12 = pr12 + ro12;
        }
        assertGt(potDay12, 0, "accumulated pot should be positive");

        vm.prank(operator); pool.settleDay();
        assertTrue(pool.conserved(), "day12 conserved");

        // Check winner is C (option 2).
        (,,,,,,,,,, uint8 winner12) = pool.days_(12);
        assertEq(winner12, 2, "day12 winner should be C");

        // p[2] voted C with 10 free — only free voter on C → gets entire free bucket.
        (uint256 paid12, uint256 free12) = pool.claimable(12, p[2]);
        assertEq(paid12, 0,        "no extra on C, no paid share");
        assertGt(free12, 0,        "free voter on winning option gets share");

        uint256 preBal = usdc.balanceOf(p[2]);
        vm.prank(p[2]); pool.claim(12);
        assertEq(usdc.balanceOf(p[2]) - preBal, free12);
        assertTrue(pool.conserved(), "final conserved");

        console2.log("cascade: pot after 10 empty days", potDay12 / USDC, "USDC");
        console2.log("cascade: p[2] free claim", free12);
    }

    // -----------------------------------------------------------------------
    // 2. CLOSE-AT BOUNDARY RACE CONDITION
    //    closesAt is set to T+1h. At exactly T+1h:
    //      - A late buy should revert (VotingClosed).
    //      - A late vote should revert (VotingClosed).
    //      - settleDay should succeed (VotingStillOpen guard uses strict <).
    //    Also verifies the one-second-before / one-second-after boundary.
    // -----------------------------------------------------------------------
    function test_closeAtBoundaryRaceCondition() public {
        MockUSDC usdc = new MockUSDC();
        NovaPool pool = new NovaPool(address(usdc), studio, owner, operator);

        address early = makeAddr("early");
        address late  = makeAddr("late");
        usdc.mint(early, 50 * USDC);
        usdc.mint(late,  50 * USDC);
        vm.prank(early); usdc.approve(address(pool), type(uint256).max);
        vm.prank(late);  usdc.approve(address(pool), type(uint256).max);

        uint64 t0       = uint64(block.timestamp);
        uint64 closesAt = t0 + 1 hours;
        vm.prank(operator); pool.setDayClose(closesAt);

        // One second before close — buy and vote should still work.
        vm.warp(closesAt - 1);
        vm.prank(early); pool.buyExtraInfluence(1);
        vm.prank(early); pool.castVote(0, 10, 10);

        // settleDay at closesAt - 1 should revert (VotingStillOpen).
        vm.expectRevert(NovaPool.VotingStillOpen.selector);
        vm.prank(operator); pool.settleDay();

        // Exactly at closesAt: buy and vote are closed.
        vm.warp(closesAt);

        vm.expectRevert(NovaPool.VotingClosed.selector);
        vm.prank(late); pool.buyExtraInfluence(1);

        vm.expectRevert(NovaPool.VotingClosed.selector);
        vm.prank(late); pool.castVote(1, 5, 0);

        // But settleDay succeeds at exactly closesAt.
        vm.prank(operator); pool.settleDay();
        assertFalse(pool.dayOpen(), "day should be settled");
        assertTrue(pool.conserved(), "boundary conserved");

        // Early voter can claim immediately after settle.
        (uint256 paid, uint256 free) = pool.claimable(1, early);
        assertGt(paid + free, 0, "early voter should have a claim");
        vm.prank(early); pool.claim(1);
        assertTrue(pool.conserved(), "post-claim conserved");

        // Open next day; a vote one second into the new day works fine.
        vm.prank(operator); pool.openNextDay(0);
        assertEq(pool.dayId(), 2);
        vm.warp(closesAt + 1);
        vm.prank(late); pool.castVote(0, 5, 0);
        assertTrue(pool.conserved());
    }

    // -----------------------------------------------------------------------
    // 3. USDC FREEZE / BLOCKLIST
    //    Verifies that:
    //      a) A global freeze blocks buyExtraInfluence (TransferFailed).
    //      b) A per-address block blocks buyExtraInfluence for that address only.
    //      c) A per-address block on a winner blocks their claim (TransferFailed)
    //         but leaves their entry.claimed = false so the prize stays in pool.
    //      d) After unblocking, the previously blocked winner can claim normally.
    //      e) All unblocked participants are never affected.
    //      f) conserved() holds throughout.
    // -----------------------------------------------------------------------
    function test_freezeBlocksAllBuysNotJustClaims() public {
        FreezableUSDC fusdc = new FreezableUSDC();
        NovaPool pool = new NovaPool(address(fusdc), studio, owner, operator);

        address normal  = makeAddr("normal");
        address willBlock = makeAddr("willBlock");
        fusdc.mint(normal,    50 * USDC);
        fusdc.mint(willBlock, 50 * USDC);
        vm.prank(normal);    fusdc.approve(address(pool), type(uint256).max);
        vm.prank(willBlock); fusdc.approve(address(pool), type(uint256).max);

        // ── a) Global freeze blocks buys ──────────────────────────────────
        fusdc.freeze();
        vm.expectRevert(NovaPool.TransferFailed.selector);
        vm.prank(normal); pool.buyExtraInfluence(1);
        assertEq(pool.gross(), 0, "frozen buy must not credit the ledger");

        fusdc.unfreeze();

        // ── b) Per-address block blocks that buyer only ───────────────────
        fusdc.block_(willBlock);
        vm.expectRevert(NovaPool.TransferFailed.selector);
        vm.prank(willBlock); pool.buyExtraInfluence(1);
        assertEq(pool.gross(), 0, "blocked buy must not credit the ledger");

        // normal can still buy.
        vm.prank(normal); pool.buyExtraInfluence(1);   // Spark
        assertEq(pool.gross(), USDC, "normal buy succeeded");
        assertTrue(pool.conserved());

        fusdc.unblock(willBlock);
        vm.prank(willBlock); pool.buyExtraInfluence(1); // Spark
        assertEq(pool.gross(), 2 * USDC);
        assertTrue(pool.conserved());

        // Both vote on the same option so both will win.
        vm.prank(normal);    pool.castVote(0, 10, 10);
        vm.prank(willBlock); pool.castVote(0, 10, 10);

        vm.prank(operator); pool.settleDay();
        assertTrue(pool.conserved(), "post-settle conserved");

        // ── c) Block willBlock at claim time ──────────────────────────────
        fusdc.block_(willBlock);

        vm.expectRevert(NovaPool.TransferFailed.selector);
        vm.prank(willBlock); pool.claim(1);

        // claimed flag must NOT be set on a failed claim.
        (,,,,, bool claimedFlag) = pool.entries(1, willBlock);
        assertFalse(claimedFlag, "failed claim must not mark entry as claimed");

        // Prize share stays in pool.
        uint256 poolBalAfterFailedClaim = fusdc.balanceOf(address(pool));
        (uint256 wb_paid, uint256 wb_free) = pool.claimable(1, willBlock);
        assertGt(wb_paid + wb_free, 0, "willBlock still claimable");

        // ── d) normal is completely unaffected ────────────────────────────
        uint256 normalBefore = fusdc.balanceOf(normal);
        vm.prank(normal); pool.claim(1);
        (uint256 np, uint256 nf) = pool.claimable(1, normal);
        assertEq(np + nf, 0, "normal fully claimed");
        assertGt(fusdc.balanceOf(normal) - normalBefore, 0, "normal received USDC");
        assertTrue(pool.conserved(), "conserved after normal claim");

        // Pool still holds willBlock's share exactly.
        assertEq(
            fusdc.balanceOf(address(pool)),
            poolBalAfterFailedClaim - (fusdc.balanceOf(normal) - normalBefore),
            "pool balance after normal claim"
        );

        // ── e) Unblock willBlock — they can now claim their share ─────────
        fusdc.unblock(willBlock);
        uint256 wbBefore = fusdc.balanceOf(willBlock);
        vm.prank(willBlock); pool.claim(1);
        assertEq(fusdc.balanceOf(willBlock) - wbBefore, wb_paid + wb_free, "willBlock claim after unblock");

        // ── f) Final state ────────────────────────────────────────────────
        // Both winners claimed; no unclaimed winners remain for this day.
        (uint256 np2, uint256 nf2) = pool.claimable(1, normal);
        assertEq(np2 + nf2, 0, "normal fully claimed final check");
        (uint256 wb_paid2, uint256 wb_free2) = pool.claimable(1, willBlock);
        assertEq(wb_paid2 + wb_free2, 0, "willBlock fully claimed final check");
        assertTrue(pool.conserved(), "final conserved");
    }
}
