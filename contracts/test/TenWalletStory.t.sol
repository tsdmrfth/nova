// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {NovaPool} from "../src/NovaPool.sol";
import {MockUSDC} from "./helpers/MockUSDC.sol";

/// @notice Fresh pool, ten wallets, seven story days. Each day locks the winner,
///         the 90/10 buckets, rollover, and every wallet's claim.
contract TenWalletStoryTest is Test {
    uint256 internal constant USDC = 1_000_000;

    MockUSDC internal usdc;
    NovaPool internal pool;
    address internal operator = makeAddr("operator");
    address[10] internal w;

    function setUp() public {
        usdc = new MockUSDC();
        pool = new NovaPool(address(usdc), makeAddr("studio"), makeAddr("owner"), operator);
        for (uint256 i = 0; i < 10; i++) {
            w[i] = makeAddr(string.concat("w", vm.toString(i)));
            usdc.mint(w[i], 100 * USDC);
            vm.prank(w[i]);
            usdc.approve(address(pool), type(uint256).max);
        }
    }

    function test_tenWalletsPlayTheWeek() public {
        _day1MostPaysBothLanes();
        _day2LeastEmptyRollsThePot();
        _day3MiddlePaysFreeAndRollsExtra();
        _day4MostSplitsExtraUnderTheCap();
        _day5LeastWithVotesPaysTheLoneWallet();
        _day6MiddleTieBreaksToTheLowerOption();
        _day7MostTieIgnoresLosingExtra();
        _booksClose();
    }

    function test_delayedDayOneClaimSurvivesLaterSettlements() public {
        _pulse(w[0]);
        _vote(w[0], 0, 10, 55);
        _vote(w[1], 1, 10, 0);
        _expectWinner(1, 0);
        _settle(1, 0, 4_050_000, 450_000, 0);
        assertEq(_claimable(1, w[0]), 4_500_000);

        _next();
        // Day 2 is LEAST. With no votes, stable A/B/C ordering makes C the winner.
        _expectWinner(2, 2);
        _settle(2, 2, 0, 0, 0);
        _next();
        // Day 3 is MIDDLE. With no votes, stable ordering makes B the winner.
        _expectWinner(3, 1);
        _settle(3, 1, 0, 0, 0);

        assertEq(_claimable(1, w[0]), 4_500_000, "later days changed an old claim");
        _claim(1, w[0], 4_050_000, 450_000);
        assertEq(_claimable(1, w[0]), 0);
        assertTrue(pool.conserved());
    }

    function test_onlyTheEmptyWinningLaneRolls() public {
        _pulse(w[0]);
        _vote(w[0], 0, 0, 55);
        _vote(w[1], 1, 10, 0);
        _expectWinner(1, 1);
        _settle(1, 1, 4_050_000, 450_000, 4_050_000);

        _claim(1, w[1], 0, 450_000);
        _next();
        (,,,,,,, uint256 rollover,,,) = pool.days_(2);
        assertEq(rollover, 4_050_000, "non-empty Free lane must not roll");
        assertTrue(pool.conserved());
    }

    function test_tenWalletFreeOnlyRoundHasNoPaidClaimsOrRollover() public {
        for (uint256 i = 0; i < 10; i++) {
            _vote(w[i], uint8(i % 3), 10, 0);
        }
        _expectWinner(1, 0);
        _settle(1, 0, 0, 0, 0);
        for (uint256 i = 0; i < 10; i++) {
            assertEq(_claimable(1, w[i]), 0);
        }
        assertEq(pool.prizePool(), 0);
        assertTrue(pool.conserved());
    }

    /// A 40 Free beats B 30 and C 30. One Pulse on A. Nothing rolls.
    function _day1MostPaysBothLanes() internal {
        _pulse(w[0]);
        _vote(w[0], 0, 10, 55);
        _vote(w[1], 0, 10, 0);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 1, 10, 0);
        _vote(w[5], 1, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 2, 10, 0);
        _vote(w[8], 2, 10, 0);
        _vote(w[9], 2, 10, 0);

        _expectWinner(1, 0);
        _settle(1, 0, 4_050_000, 450_000, 0);
        _claim(1, w[0], 4_050_000, 112_500);
        _claim(1, w[1], 0, 112_500);
        _claim(1, w[2], 0, 112_500);
        _claim(1, w[3], 0, 112_500);
        for (uint256 i = 4; i < 10; i++) {
            _claim(1, w[i], 0, 0);
        }
        _next();
    }

    /// Nobody votes C. LEAST picks C, so both buckets roll. Buys on A and B pay nobody.
    function _day2LeastEmptyRollsThePot() internal {
        _pulse(w[0]);
        _pulse(w[1]);
        _vote(w[0], 0, 10, 55);
        _vote(w[1], 1, 10, 55);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 0, 10, 0);
        _vote(w[5], 0, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 1, 10, 0);
        _vote(w[8], 1, 10, 0);
        _vote(w[9], 1, 10, 0);

        _expectWinner(2, 2);
        _settle(2, 2, 8_100_000, 900_000, 9_000_000);
        for (uint256 i = 0; i < 10; i++) {
            _claim(2, w[i], 0, 0);
        }
        _next();
    }

    /// MIDDLE is B. B has Free and no Extra, so the Free bucket pays and the Extra bucket rolls.
    function _day3MiddlePaysFreeAndRollsExtra() internal {
        _spark(w[0]);
        _vote(w[0], 0, 10, 10);
        _vote(w[1], 0, 10, 0);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 0, 10, 0);
        _vote(w[5], 1, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 1, 10, 0);
        _vote(w[8], 2, 10, 0);
        _vote(w[9], 2, 10, 0);

        _expectWinner(3, 1);
        _settle(3, 1, 8_910_000, 990_000, 8_910_000);
        for (uint256 i = 0; i < 5; i++) {
            _claim(3, w[i], 0, 0);
        }
        _claim(3, w[5], 0, 330_000);
        _claim(3, w[6], 0, 330_000);
        _claim(3, w[7], 0, 330_000);
        _claim(3, w[8], 0, 0);
        _claim(3, w[9], 0, 0);
        _next();
    }

    /// MOST is A. 110 Extra counts as 100, beside 55. One micro-USDC of floor dust stays behind.
    function _day4MostSplitsExtraUnderTheCap() internal {
        _pulse(w[0]);
        _pulse(w[0]);
        _pulse(w[1]);
        _vote(w[0], 0, 10, 110);
        _vote(w[1], 0, 10, 55);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 1, 10, 0);
        _vote(w[5], 1, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 2, 10, 0);
        _vote(w[8], 2, 10, 0);
        _vote(w[9], 2, 10, 0);

        _expectWinner(4, 0);
        _settle(4, 0, 20_169_000, 2_241_000, 0);
        _claim(4, w[0], 13_012_258, 560_250);
        _claim(4, w[1], 7_156_741, 560_250);
        _claim(4, w[2], 0, 560_250);
        _claim(4, w[3], 0, 560_250);
        for (uint256 i = 4; i < 10; i++) {
            _claim(4, w[i], 0, 0);
        }
        _next();
    }

    /// Every answer has votes. LEAST is the single wallet on C, and that wallet's Extra takes the paid bucket.
    function _day5LeastWithVotesPaysTheLoneWallet() internal {
        _pulse(w[0]);
        _pulse(w[9]);
        _vote(w[0], 0, 10, 55);
        _vote(w[1], 0, 10, 0);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 0, 10, 0);
        _vote(w[5], 1, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 1, 10, 0);
        _vote(w[8], 1, 10, 0);
        _vote(w[9], 2, 10, 55);

        _expectWinner(5, 2);
        _settle(5, 2, 8_100_000, 900_000, 0);
        for (uint256 i = 0; i < 9; i++) {
            _claim(5, w[i], 0, 0);
        }
        _claim(5, w[9], 8_100_000, 900_000);
        _next();
    }

    /// C has the most Free. A and B tie. MIDDLE is A, because a tie keeps the lower letter ahead.
    function _day6MiddleTieBreaksToTheLowerOption() internal {
        _spark(w[4]);
        _vote(w[0], 2, 10, 0);
        _vote(w[1], 2, 10, 0);
        _vote(w[2], 2, 10, 0);
        _vote(w[3], 2, 10, 0);
        _vote(w[4], 0, 10, 10);
        _vote(w[5], 0, 10, 0);
        _vote(w[6], 0, 10, 0);
        _vote(w[7], 1, 10, 0);
        _vote(w[8], 1, 10, 0);
        _vote(w[9], 1, 10, 0);

        _expectWinner(6, 0);
        _settle(6, 0, 810_000, 90_000, 0);
        for (uint256 i = 0; i < 4; i++) {
            _claim(6, w[i], 0, 0);
        }
        _claim(6, w[4], 810_000, 30_000);
        _claim(6, w[5], 0, 30_000);
        _claim(6, w[6], 0, 30_000);
        for (uint256 i = 7; i < 10; i++) {
            _claim(6, w[i], 0, 0);
        }
        _next();
    }

    /// A and B tie on Free. MOST keeps A. Two Pulses on the losing answer pay nothing.
    function _day7MostTieIgnoresLosingExtra() internal {
        _pulse(w[0]);
        _pulse(w[1]);
        _pulse(w[4]);
        _pulse(w[4]);
        _vote(w[0], 0, 10, 55);
        _vote(w[1], 0, 10, 55);
        _vote(w[2], 0, 10, 0);
        _vote(w[3], 0, 10, 0);
        _vote(w[4], 1, 10, 110);
        _vote(w[5], 1, 10, 0);
        _vote(w[6], 1, 10, 0);
        _vote(w[7], 1, 10, 0);
        _vote(w[8], 2, 10, 0);
        _vote(w[9], 2, 10, 0);

        _expectWinner(7, 0);
        _settle(7, 0, 16_200_000, 1_800_000, 0);
        _claim(7, w[0], 8_100_000, 450_000);
        _claim(7, w[1], 8_100_000, 450_000);
        _claim(7, w[2], 0, 450_000);
        _claim(7, w[3], 0, 450_000);
        for (uint256 i = 4; i < 10; i++) {
            _claim(7, w[i], 0, 0);
        }
    }

    function _booksClose() internal view {
        (uint256 gross, uint256 prize, uint256 studioNet, uint256 budget,,,,,) = pool.snapshot();
        assertEq(gross, 62 * USDC);
        assertEq(studioNet, 4_960_000);
        assertEq(budget, 1_240_000);
        assertEq(pool.prizeClaimed(), 55_800_000 - 1);
        assertEq(prize, 1);
        assertEq(prize + studioNet + budget + pool.prizeClaimed(), gross);
        console2.log("week gross USDC", gross / USDC);
        console2.log("dust left in prize pool", prize);
    }

    function _spark(address wallet) internal {
        vm.prank(wallet);
        pool.buyExtraInfluence(1);
    }

    function _pulse(address wallet) internal {
        vm.prank(wallet);
        pool.buyExtraInfluence(2);
    }

    function _vote(address wallet, uint8 option, uint256 free, uint256 extra) internal {
        vm.prank(wallet);
        pool.castVote(option, free, extra);
    }

    function _expectWinner(uint256 day, uint8 winner) internal view {
        assertEq(pool.goalFor(day), uint8((day - 1) % 3));
        assertEq(pool.pickWinner(day), winner);
    }

    function _settle(uint256 day, uint8 winner, uint256 paid, uint256 freeBucket, uint256 rolled) internal {
        assertEq(pool.dayId(), day, "settling unexpected day");
        assertTrue(pool.dayOpen(), "day must be open before settle");
        vm.prank(operator);
        pool.settleDay();
        _assertDayGrossSplit(day);
        (,,,, uint256 paidBucket, uint256 freeGot, bool settled, uint256 rollover, uint256 rolledOut,, uint8 won) =
            pool.days_(day);
        assertTrue(settled);
        assertFalse(pool.dayOpen());
        assertEq(won, winner);
        assertEq(paidBucket, paid);
        assertEq(freeGot, freeBucket);
        assertEq(rolledOut, rolled);
        assertEq(paidBucket + freeGot, _pot(day));
        if (day > 1) assertEq(rollover, _priorRoll(day));
        assertTrue(pool.conserved());
        console2.log("day", day);
        console2.log("  winner", won);
        console2.log("  paid", paidBucket);
        console2.log("  free", freeGot);
        console2.log("  rolled", rolledOut);
    }

    function _assertDayGrossSplit(uint256 day) internal view {
        (uint256 gross, uint256 prize, uint256 studio, uint256 budget,,,,,,,) = pool.days_(day);
        assertEq(gross, prize + studio + budget, "day gross split");
    }

    function _pot(uint256 day) internal view returns (uint256) {
        (, uint256 prize,,,,,, uint256 rollover,,,) = pool.days_(day);
        return prize + rollover;
    }

    function _priorRoll(uint256 day) internal view returns (uint256) {
        (,,,,,,,, uint256 rolledOut,,) = pool.days_(day - 1);
        return rolledOut;
    }

    function _claim(uint256 day, address wallet, uint256 paid, uint256 freeShare) internal {
        (uint256 gotPaid, uint256 gotFree) = pool.claimable(day, wallet);
        assertEq(gotPaid, paid, "paid share");
        assertEq(gotFree, freeShare, "free share");
        if (paid + freeShare == 0) return;
        uint256 before = usdc.balanceOf(wallet);
        vm.prank(wallet);
        pool.claim(day);
        assertEq(usdc.balanceOf(wallet) - before, paid + freeShare);
        assertEq(_claimable(day, wallet), 0, "claimed wallet remains claimable");
        assertTrue(pool.conserved());
    }

    function _next() internal {
        uint256 priorDay = pool.dayId();
        uint256 expectedRollover = _priorRoll(priorDay + 1);
        assertFalse(pool.dayOpen(), "cannot open while prior day is open");
        vm.prank(operator);
        pool.openNextDay(0);
        assertEq(pool.dayId(), priorDay + 1);
        assertTrue(pool.dayOpen());
        (,,,,,,, uint256 rollover,,,) = pool.days_(priorDay + 1);
        assertEq(rollover, expectedRollover, "rollover was not carried exactly once");
        assertTrue(pool.conserved());
    }

    function _claimable(uint256 day, address wallet) internal view returns (uint256) {
        (uint256 paid, uint256 freeShare) = pool.claimable(day, wallet);
        return paid + freeShare;
    }
}
