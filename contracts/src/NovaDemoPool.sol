// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {BuySplit} from "./BuySplit.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title NovaDemoPool
/// @notice Slim Arc demo pool: Spark/Pulse Extra Influence buys, a day settle snapshot,
///         and a ledger that keeps prize, studio net, and the Nova operating budget apart.
///         S1 has no prize withdrawal and no prize top-up. Prize USDC stays in this contract.
///         Buys are nonpayable ERC-20 pulls, so a native USDC send cannot skip the split.
contract NovaDemoPool {
    uint8 public constant PACK_SPARK = 1;
    uint8 public constant PACK_PULSE = 2;
    uint256 public constant SPARK_PRICE = 1_000_000;
    uint256 public constant PULSE_PRICE = 5_000_000;
    uint256 public constant SPARK_EXTRA = 10;
    uint256 public constant PULSE_EXTRA = 55;
    uint256 public constant MAX_DAILY_BUY = 10_000_000;

    IERC20 public immutable usdc;
    address public immutable studio;
    address public owner;
    address public signal;
    bool public signalLocked;

    uint256 public gross;
    uint256 public prizePool;
    uint256 public studioNet;
    uint256 public novaBudget;
    uint256 public studioNetWithdrawn;
    uint256 public novaBudgetSpent;
    uint256 public settledNovaBudget;

    uint256 public dayId;
    bool public dayOpen;

    struct DayLedger {
        uint256 gross;
        uint256 prize;
        uint256 studioNet;
        uint256 novaBudget;
        uint256 paidBucket;
        uint256 freeBucket;
        bool settled;
    }

    mapping(uint256 => DayLedger) public days_;
    mapping(uint256 => mapping(address => uint256)) public spentOnDay;

    uint256 private locked;

    event ExtraInfluenceBought(
        address indexed buyer,
        uint256 indexed dayId,
        uint8 packId,
        uint256 grossAmount,
        uint256 prize,
        uint256 studioNetAmount,
        uint256 novaBudgetAmount,
        uint256 extraInfluence
    );
    event DaySettled(
        uint256 indexed dayId,
        uint256 prize,
        uint256 paidBucket,
        uint256 freeBucket,
        uint256 studioNetAmount,
        uint256 novaBudgetAmount
    );
    event NextDayOpened(uint256 indexed dayId);
    event NovaBudgetReleased(address indexed to, uint256 amount, uint256 novaBudgetRemaining);
    event StudioNetWithdrawn(address indexed studio, uint256 amount, uint256 studioNetRemaining);
    event SignalSet(address indexed signal);
    event OwnershipTransferred(address indexed owner);

    error NotOwner();
    error NotStudio();
    error NotSignal();
    error UnknownPack();
    error DailyCapExceeded();
    error DayNotOpen();
    error DayStillOpen();
    error DayNotSettled();
    error AlreadySettled();
    error TransferFailed();
    error ZeroAmount();
    error ZeroAddress();
    error BudgetExceeded();
    error SignalLocked();
    error InvariantBroken();
    error Reentrancy();

    modifier nonReentrant() {
        if (locked == 1) revert Reentrancy();
        locked = 1;
        _;
        locked = 0;
    }

    constructor(address usdc_, address studio_, address owner_) {
        if (usdc_ == address(0) || studio_ == address(0) || owner_ == address(0)) {
            revert ZeroAddress();
        }
        usdc = IERC20(usdc_);
        studio = studio_;
        owner = owner_;
        dayId = 1;
        dayOpen = true;
    }

    function buyExtraInfluence(uint8 packId) external nonReentrant returns (uint256 extraInfluence) {
        if (!dayOpen) revert DayNotOpen();

        uint256 price;
        if (packId == PACK_SPARK) {
            price = SPARK_PRICE;
            extraInfluence = SPARK_EXTRA;
        } else if (packId == PACK_PULSE) {
            price = PULSE_PRICE;
            extraInfluence = PULSE_EXTRA;
        } else {
            revert UnknownPack();
        }

        uint256 spent = spentOnDay[dayId][msg.sender];
        if (spent + price > MAX_DAILY_BUY) revert DailyCapExceeded();

        _pull(msg.sender, price);

        (uint256 prize, uint256 studioPart, uint256 budgetPart) = BuySplit.splitGross(price);
        if (prize + studioPart + budgetPart != price) revert InvariantBroken();

        spentOnDay[dayId][msg.sender] = spent + price;

        DayLedger storage day = days_[dayId];
        day.gross += price;
        day.prize += prize;
        day.studioNet += studioPart;
        day.novaBudget += budgetPart;

        gross += price;
        prizePool += prize;
        studioNet += studioPart;
        novaBudget += budgetPart;

        if (!_conserved()) revert InvariantBroken();

        emit ExtraInfluenceBought(
            msg.sender, dayId, packId, price, prize, studioPart, budgetPart, extraInfluence
        );
    }

    /// @notice Snapshots the day's prize into 90% paid / 10% free buckets.
    ///         Does not move prize USDC. Unlocks that day's Nova budget for NovaSignal.
    function settleDay() external {
        if (msg.sender != owner) revert NotOwner();
        if (!dayOpen) revert AlreadySettled();

        DayLedger storage day = days_[dayId];
        (uint256 paid, uint256 freeBucket) = BuySplit.splitDay(day.prize);
        if (paid + freeBucket != day.prize) revert InvariantBroken();

        day.paidBucket = paid;
        day.freeBucket = freeBucket;
        day.settled = true;
        dayOpen = false;
        settledNovaBudget += day.novaBudget;

        emit DaySettled(dayId, day.prize, paid, freeBucket, day.studioNet, day.novaBudget);
    }

    function openNextDay() external {
        if (msg.sender != owner) revert NotOwner();
        if (dayOpen) revert DayStillOpen();
        if (!days_[dayId].settled) revert DayNotSettled();
        dayId += 1;
        dayOpen = true;
        emit NextDayOpened(dayId);
    }

    /// @notice Spends settled Nova operating budget only. Prize and studio net stay put.
    function releaseNovaBudget(address to, uint256 amount) external nonReentrant {
        if (msg.sender != signal) revert NotSignal();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > spendableNovaBudget()) revert BudgetExceeded();

        uint256 prizeBefore = prizePool;
        novaBudgetSpent += amount;
        novaBudget -= amount;
        _push(to, amount);

        if (prizePool != prizeBefore || !_conserved()) revert InvariantBroken();
        emit NovaBudgetReleased(to, amount, novaBudget);
    }

    /// @notice Studio net only, to the immutable studio address. Cannot reach the prize.
    function withdrawStudioNet(uint256 amount) external nonReentrant {
        if (msg.sender != studio) revert NotStudio();
        if (amount == 0) revert ZeroAmount();
        if (amount > studioNet) revert BudgetExceeded();

        uint256 prizeBefore = prizePool;
        uint256 budgetBefore = novaBudget;
        studioNet -= amount;
        studioNetWithdrawn += amount;
        _push(studio, amount);

        if (prizePool != prizeBefore || novaBudget != budgetBefore || !_conserved()) {
            revert InvariantBroken();
        }
        emit StudioNetWithdrawn(studio, amount, studioNet);
    }

    function setSignal(address next) external {
        if (msg.sender != owner) revert NotOwner();
        if (signalLocked) revert SignalLocked();
        if (next == address(0)) revert ZeroAddress();
        signal = next;
        signalLocked = true;
        emit SignalSet(next);
    }

    function transferOwnership(address next) external {
        if (msg.sender != owner) revert NotOwner();
        if (next == address(0)) revert ZeroAddress();
        owner = next;
        emit OwnershipTransferred(next);
    }

    function spendableNovaBudget() public view returns (uint256) {
        return settledNovaBudget - novaBudgetSpent;
    }

    function conserved() external view returns (bool) {
        return _conserved();
    }

    function splitBps() external pure returns (uint256 prizeBps, uint256 studioBps, uint256 budgetBps) {
        return (BuySplit.PRIZE_BPS, BuySplit.STUDIO_NET_BPS, BuySplit.NOVA_BUDGET_BPS);
    }

    function dayBuckets(uint256 id)
        external
        view
        returns (uint256 paid, uint256 freeBucket, uint256 prize, bool settled)
    {
        DayLedger storage day = days_[id];
        return (day.paidBucket, day.freeBucket, day.prize, day.settled);
    }

    function snapshot()
        external
        view
        returns (
            uint256 gross_,
            uint256 prize_,
            uint256 studio_,
            uint256 budget_,
            uint256 day_,
            bool open_,
            bool settled_,
            uint256 settledBudget_,
            uint256 budgetSpent_
        )
    {
        DayLedger storage day = days_[dayId];
        return (
            gross,
            prizePool,
            studioNet,
            novaBudget,
            dayId,
            dayOpen,
            day.settled,
            settledNovaBudget,
            novaBudgetSpent
        );
    }

    function _conserved() internal view returns (bool) {
        return prizePool + studioNet + novaBudget + studioNetWithdrawn + novaBudgetSpent == gross;
    }

    function _pull(address from, uint256 amount) internal {
        (bool ok, bytes memory data) = address(usdc).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), amount)
        );
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _push(address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(usdc).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
