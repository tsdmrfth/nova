// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {BuySplit} from "./BuySplit.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title NovaPool
/// @notice Arc game pool: Spark/Pulse Extra Influence buys, one vote per wallet per day,
///         an onchain day settle that picks W* from Free tallies only, and pull-based
///         prize claims. The ledger keeps prize, studio net, and the Nova operating budget apart.
///         Buys are nonpayable ERC-20 pulls, so a native USDC send cannot skip the split.
///
///         Not upgradeable: a rule change ships as a new pool, and the old one stays claimable.
///         Roles: `owner` (meant to be a multisig) sets the operator and signal, unpauses, and
///         hands over ownership in two steps. `operator` (a hot key) runs the day loop; the owner
///         can too. Either can pause, which stops buys and votes only. Claims and the studio and
///         budget withdrawals never pause.
///
///         Payout per winner: lane bucket × weight / Σ weights on W* (floor).
///         Paid weight = min(Extra on W*, 100). Free weight = Free on W* (≤ 10).
///         An empty winner lane rolls its whole bucket into the next day's prize.
///         Floor dust stays in `prizePool`, unassigned.
contract NovaPool {
    uint8 public constant PACK_SPARK = 1;
    uint8 public constant PACK_PULSE = 2;
    uint256 public constant SPARK_PRICE = 1_000_000;
    uint256 public constant PULSE_PRICE = 5_000_000;
    uint256 public constant SPARK_EXTRA = 10;
    uint256 public constant PULSE_EXTRA = 55;
    uint256 public constant MAX_DAILY_BUY = 10_000_000;

    uint8 public constant OPTION_COUNT = 3;
    uint256 public constant FREE_DAILY_GRANT = 10;
    uint256 public constant EFFECTIVE_EXTRA_CAP = 100;
    /// @dev Day goal rotation: day 1 MOST, day 2 LEAST, day 3 MIDDLE, day 4 MOST, …
    uint8 public constant GOAL_MOST = 0;
    uint8 public constant GOAL_LEAST = 1;
    uint8 public constant GOAL_MIDDLE = 2;

    IERC20 public immutable usdc;
    address public immutable studio;
    address public owner;
    address public pendingOwner;
    address public operator;
    address public signal;
    bool public signalLocked;
    bool public paused;

    uint256 public gross;
    /// @notice Prize USDC held by this contract and not yet claimed (includes rollover and dust).
    uint256 public prizePool;
    uint256 public studioNet;
    uint256 public novaBudget;
    uint256 public studioNetWithdrawn;
    uint256 public novaBudgetSpent;
    uint256 public settledNovaBudget;
    uint256 public prizeClaimed;

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
        /// Prize carried in from the previous day's empty lanes.
        uint256 rollover;
        /// Empty-lane buckets carried out to the next day.
        uint256 rolledOut;
        /// Unix seconds; 0 means the owner closes the day by settling.
        uint64 closesAt;
        uint8 winner;
    }

    struct Entry {
        uint64 extraBought;
        uint64 extraPlaced;
        uint8 free;
        uint8 option;
        bool voted;
        bool claimed;
    }

    mapping(uint256 => DayLedger) public days_;
    mapping(uint256 => mapping(address => uint256)) public spentOnDay;
    mapping(uint256 => mapping(address => Entry)) public entries;
    mapping(uint256 => uint256[3]) internal freeTally;
    mapping(uint256 => uint256[3]) internal extraTally;

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
    event VoteCast(address indexed voter, uint256 indexed dayId, uint8 option, uint256 free, uint256 extra);
    event DaySettled(
        uint256 indexed dayId,
        uint256 prize,
        uint256 paidBucket,
        uint256 freeBucket,
        uint256 studioNetAmount,
        uint256 novaBudgetAmount
    );
    event WinnerPicked(uint256 indexed dayId, uint8 winner, uint256 rolledOut);
    event PrizeClaimed(address indexed player, uint256 indexed dayId, uint256 paid, uint256 free);
    event NextDayOpened(uint256 indexed dayId);
    event DayCloseSet(uint256 indexed dayId, uint64 closesAt);
    event NovaBudgetReleased(address indexed to, uint256 amount, uint256 novaBudgetRemaining);
    event StudioNetWithdrawn(address indexed studio, uint256 amount, uint256 studioNetRemaining);
    event SignalSet(address indexed signal);
    event OperatorSet(address indexed operator);
    event PausedSet(bool paused);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotOperator();
    error NotPendingOwner();
    error GamePaused();
    error NotStudio();
    error NotSignal();
    error UnknownPack();
    error UnknownOption();
    error DailyCapExceeded();
    error DayNotOpen();
    error DayStillOpen();
    error DayNotSettled();
    error AlreadySettled();
    error VotingClosed();
    error VotingStillOpen();
    error AlreadyVoted();
    error PurchaseClosed();
    error FreeExceeded();
    error ExtraExceeded();
    error AlreadyClaimed();
    error NothingToClaim();
    error BadCloseTime();
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

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @dev The owner can stand in for the operator, so a lost hot key never strands a day.
    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner) revert NotOperator();
        _;
    }

    constructor(address usdc_, address studio_, address owner_, address operator_) {
        if (
            usdc_ == address(0) || studio_ == address(0) || owner_ == address(0)
                || operator_ == address(0)
        ) {
            revert ZeroAddress();
        }
        usdc = IERC20(usdc_);
        studio = studio_;
        owner = owner_;
        operator = operator_;
        dayId = 1;
        dayOpen = true;
        emit OwnershipTransferred(address(0), owner_);
        emit OperatorSet(operator_);
    }

    function buyExtraInfluence(uint8 packId) external nonReentrant returns (uint256 extraInfluence) {
        _requireVotingOpen();
        Entry storage entry = entries[dayId][msg.sender];
        // Extra is spent on the vote. A later buy cannot land on a locked pick.
        if (entry.voted) revert PurchaseClosed();

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

        entry.extraBought += uint64(extraInfluence);

        if (!_conserved()) revert InvariantBroken();

        // Effects first, then the one external call.
        _pull(msg.sender, price);

        emit ExtraInfluenceBought(
            msg.sender, dayId, packId, price, prize, studioPart, budgetPart, extraInfluence
        );
    }

    /// @notice One vote per wallet per day. Free comes from the daily grant of 10;
    ///         Extra comes from today's buys. Extra never changes which option wins.
    function castVote(uint8 option, uint256 free, uint256 extra) external {
        _requireVotingOpen();
        if (option >= OPTION_COUNT) revert UnknownOption();
        if (free + extra == 0) revert ZeroAmount();
        if (free > FREE_DAILY_GRANT) revert FreeExceeded();

        Entry storage entry = entries[dayId][msg.sender];
        if (entry.voted) revert AlreadyVoted();
        if (extra > entry.extraBought) revert ExtraExceeded();

        entry.voted = true;
        entry.option = option;
        entry.free = uint8(free);
        freeTally[dayId][option] += free;
        _placeExtra(entry, extra);

        emit VoteCast(msg.sender, dayId, option, free, extra);
    }

    /// @notice Picks W* from Free tallies, snapshots the 90/10 buckets of today's prize
    ///         plus rollover, and unlocks the day's Nova budget for NovaSignal.
    ///         Does not move prize USDC; winners pull with `claim`.
    function settleDay() external onlyOperator {
        if (!dayOpen) revert AlreadySettled();
        DayLedger storage day = days_[dayId];
        if (day.closesAt != 0 && block.timestamp < day.closesAt) revert VotingStillOpen();

        uint256 pot = day.prize + day.rollover;
        (uint256 paid, uint256 freeBucket) = BuySplit.splitDay(pot);
        if (paid + freeBucket != pot) revert InvariantBroken();

        uint8 winner = pickWinner(dayId);
        uint256 rolledOut;
        if (extraTally[dayId][winner] == 0) rolledOut += paid;
        if (freeTally[dayId][winner] == 0) rolledOut += freeBucket;

        day.paidBucket = paid;
        day.freeBucket = freeBucket;
        day.winner = winner;
        day.rolledOut = rolledOut;
        day.settled = true;
        dayOpen = false;
        settledNovaBudget += day.novaBudget;

        emit DaySettled(dayId, pot, paid, freeBucket, day.studioNet, day.novaBudget);
        emit WinnerPicked(dayId, winner, rolledOut);
    }

    /// @param closesAt Unix seconds for the new day's vote close; 0 leaves it to `settleDay`.
    function openNextDay(uint64 closesAt) external onlyOperator {
        if (dayOpen) revert DayStillOpen();
        if (!days_[dayId].settled) revert DayNotSettled();
        if (closesAt != 0 && closesAt <= block.timestamp) revert BadCloseTime();
        uint256 carry = days_[dayId].rolledOut;
        dayId += 1;
        dayOpen = true;
        days_[dayId].rollover = carry;
        days_[dayId].closesAt = closesAt;
        emit NextDayOpened(dayId);
        emit DayCloseSet(dayId, closesAt);
    }

    function setDayClose(uint64 closesAt) external onlyOperator {
        if (!dayOpen) revert DayNotOpen();
        if (closesAt != 0 && closesAt <= block.timestamp) revert BadCloseTime();
        days_[dayId].closesAt = closesAt;
        emit DayCloseSet(dayId, closesAt);
    }

    /// @notice Pulls the caller's share of a settled day. Prize USDC only.
    function claim(uint256 id) external nonReentrant returns (uint256 amount) {
        Entry storage entry = entries[id][msg.sender];
        if (entry.claimed) revert AlreadyClaimed();
        (uint256 paidShare, uint256 freeShare) = claimable(id, msg.sender);
        amount = paidShare + freeShare;
        if (amount == 0) revert NothingToClaim();

        uint256 studioBefore = studioNet;
        uint256 budgetBefore = novaBudget;
        entry.claimed = true;
        prizePool -= amount;
        prizeClaimed += amount;
        _push(msg.sender, amount);

        if (studioNet != studioBefore || novaBudget != budgetBefore || !_conserved()) {
            revert InvariantBroken();
        }
        emit PrizeClaimed(msg.sender, id, paidShare, freeShare);
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

    function setSignal(address next) external onlyOwner {
        if (signalLocked) revert SignalLocked();
        if (next == address(0)) revert ZeroAddress();
        signal = next;
        signalLocked = true;
        emit SignalSet(next);
    }

    function setOperator(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        operator = next;
        emit OperatorSet(next);
    }

    /// @notice Stops buys and votes. Claims and withdrawals keep working.
    function pause() external onlyOperator {
        paused = true;
        emit PausedSet(true);
    }

    /// @notice Only the owner resumes play, so a leaked operator key cannot undo a pause.
    function unpause() external onlyOwner {
        paused = false;
        emit PausedSet(false);
    }

    /// @notice Step one of two: `next` must call `acceptOwnership`. Pass address(0) to cancel.
    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
        emit OwnershipTransferStarted(owner, next);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function goalFor(uint256 id) public pure returns (uint8) {
        return uint8((id - 1) % 3);
    }

    /// @notice W* from Free tallies only. Rank is Free descending, then option ascending.
    ///         MOST is rank 0, LEAST is rank 2, MIDDLE is rank 1.
    function pickWinner(uint256 id) public view returns (uint8) {
        uint256[3] storage tally = freeTally[id];
        uint8[3] memory ranked = [uint8(0), 1, 2];
        for (uint256 i = 1; i < 3; i++) {
            uint8 current = ranked[i];
            uint256 j = i;
            while (j > 0 && tally[ranked[j - 1]] < tally[current]) {
                ranked[j] = ranked[j - 1];
                j--;
            }
            ranked[j] = current;
        }
        uint8 goal = goalFor(id);
        if (goal == GOAL_MOST) return ranked[0];
        if (goal == GOAL_LEAST) return ranked[2];
        return ranked[1];
    }

    /// @notice Unclaimed share of a settled day. Zero before settle, for a miss, or once claimed.
    function claimable(uint256 id, address player) public view returns (uint256 paidShare, uint256 freeShare) {
        DayLedger storage day = days_[id];
        Entry storage entry = entries[id][player];
        if (!day.settled || !entry.voted || entry.claimed || entry.option != day.winner) {
            return (0, 0);
        }
        uint256 extraTotal = extraTally[id][day.winner];
        uint256 freeTotal = freeTally[id][day.winner];
        uint256 extraWeight = _effectiveExtra(entry.extraPlaced);
        if (extraTotal > 0 && extraWeight > 0) paidShare = (day.paidBucket * extraWeight) / extraTotal;
        if (freeTotal > 0 && entry.free > 0) freeShare = (day.freeBucket * entry.free) / freeTotal;
    }

    /// @notice Per-option Free tallies and effective (capped) Extra weights.
    function optionTallies(uint256 id)
        external
        view
        returns (uint256[3] memory free, uint256[3] memory extraEffective)
    {
        return (freeTally[id], extraTally[id]);
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
        return (day.paidBucket, day.freeBucket, day.prize + day.rollover, day.settled);
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

    function _requireVotingOpen() internal view {
        if (paused) revert GamePaused();
        if (!dayOpen) revert DayNotOpen();
        uint64 closesAt = days_[dayId].closesAt;
        if (closesAt != 0 && block.timestamp >= closesAt) revert VotingClosed();
    }

    function _placeExtra(Entry storage entry, uint256 extra) internal {
        if (extra == 0) return;
        uint256 before = entry.extraPlaced;
        uint256 next = before + extra;
        if (next > entry.extraBought) revert ExtraExceeded();
        entry.extraPlaced = uint64(next);
        extraTally[dayId][entry.option] += _effectiveExtra(next) - _effectiveExtra(before);
    }

    function _effectiveExtra(uint256 raw) internal pure returns (uint256) {
        return raw < EFFECTIVE_EXTRA_CAP ? raw : EFFECTIVE_EXTRA_CAP;
    }

    function _conserved() internal view returns (bool) {
        return prizePool + studioNet + novaBudget + studioNetWithdrawn + novaBudgetSpent + prizeClaimed
            == gross;
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
