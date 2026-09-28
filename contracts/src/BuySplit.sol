// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Extra Influence gross split and day-bucket split.
///         Gross: 90% prize / 8% studio net / 2% Nova operating budget.
///         Day buckets of P stay 90% paid / 10% free.
///         Integer dust on a buy stays in the prize so studio and budget never exceed their bps.
library BuySplit {
    uint256 internal constant BPS = 10_000;
    uint256 internal constant PRIZE_BPS = 9_000;
    uint256 internal constant STUDIO_NET_BPS = 800;
    uint256 internal constant NOVA_BUDGET_BPS = 200;
    uint256 internal constant DAY_PAID_BPS = 9_000;
    uint256 internal constant DAY_FREE_BPS = 1_000;

    function splitGross(uint256 gross)
        internal
        pure
        returns (uint256 prize, uint256 studioNet, uint256 novaBudget)
    {
        studioNet = (gross * STUDIO_NET_BPS) / BPS;
        novaBudget = (gross * NOVA_BUDGET_BPS) / BPS;
        prize = gross - studioNet - novaBudget;
    }

    function splitDay(uint256 prize) internal pure returns (uint256 paid, uint256 freeBucket) {
        paid = (prize * DAY_PAID_BPS) / BPS;
        freeBucket = prize - paid;
    }
}
