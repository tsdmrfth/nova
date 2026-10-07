// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {NovaPool} from "./NovaPool.sol";

/// @title NovaSignal
/// @notice Post-settle public USDC signal. Spends only the Nova operating budget
///         and only to the configured Nova public wallet.
///         Caller allowlist + hard cap. There is no prize top-up function.
contract NovaSignal {
    NovaPool public immutable pool;
    address public novaWallet;
    uint256 public immutable hardCap;
    uint256 public totalSignaled;
    address public owner;
    address public pendingOwner;
    mapping(address => bool) public allowlist;

    uint256 private locked;

    event Signaled(
        address indexed agent, address indexed novaWallet, uint256 amount, uint256 prizePoolAfter
    );
    event AllowlistSet(address indexed account, bool allowed);
    event NovaWalletSet(address indexed novaWallet);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotPendingOwner();
    error NotAllowlisted();
    error CapExceeded();
    error ZeroAmount();
    error ZeroAddress();
    error PrizeMoved();
    error Reentrancy();

    modifier nonReentrant() {
        if (locked == 1) revert Reentrancy();
        locked = 1;
        _;
        locked = 0;
    }

    constructor(
        address pool_,
        address novaWallet_,
        uint256 hardCap_,
        address owner_,
        address[] memory agents
    ) {
        if (pool_ == address(0) || novaWallet_ == address(0) || owner_ == address(0)) {
            revert ZeroAddress();
        }
        if (hardCap_ == 0) revert ZeroAmount();
        pool = NovaPool(pool_);
        novaWallet = novaWallet_;
        hardCap = hardCap_;
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
        uint256 count = agents.length;
        for (uint256 i = 0; i < count; i++) {
            address agent = agents[i];
            if (agent == address(0)) revert ZeroAddress();
            allowlist[agent] = true;
            emit AllowlistSet(agent, true);
        }
    }

    /// @notice Transfers `amount` of operating-budget USDC to `novaWallet`.
    ///         The recipient is not a parameter — the prize pool cannot be the target.
    function signal(uint256 amount) external nonReentrant {
        if (!allowlist[msg.sender]) revert NotAllowlisted();
        if (amount == 0) revert ZeroAmount();
        if (totalSignaled + amount > hardCap) revert CapExceeded();

        uint256 prizeBefore = pool.prizePool();
        totalSignaled += amount;
        pool.releaseNovaBudget(novaWallet, amount);
        uint256 prizeAfter = pool.prizePool();
        if (prizeAfter != prizeBefore) revert PrizeMoved();

        emit Signaled(msg.sender, novaWallet, amount, prizeAfter);
    }

    function setAllowlist(address account, bool allowed) external {
        if (msg.sender != owner) revert NotOwner();
        if (account == address(0)) revert ZeroAddress();
        allowlist[account] = allowed;
        emit AllowlistSet(account, allowed);
    }

    function setNovaWallet(address next) external {
        if (msg.sender != owner) revert NotOwner();
        if (next == address(0)) revert ZeroAddress();
        novaWallet = next;
        emit NovaWalletSet(next);
    }

    /// @notice Step one of two: `next` must call `acceptOwnership`. Pass address(0) to cancel.
    function transferOwnership(address next) external {
        if (msg.sender != owner) revert NotOwner();
        pendingOwner = next;
        emit OwnershipTransferStarted(owner, next);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function snapshot()
        external
        view
        returns (address wallet, uint256 cap, uint256 signaled, uint256 remainingCap)
    {
        wallet = novaWallet;
        cap = hardCap;
        signaled = totalSignaled;
        remainingCap = hardCap - totalSignaled;
    }
}
