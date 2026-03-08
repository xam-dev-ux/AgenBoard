// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AgentboardReputation
/// @notice Reputation, reviews, trust snapshots, and skill verifications for ERC-8004 agents on Base.
/// @dev ERC-8004 registry validation is handled by the off-chain indexer, not onchain.
///      The contract is self-contained and deploys with no external registry dependency.
contract AgentboardReputation is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    uint256 public constant PREMIUM_DURATION = 30 days;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct PremiumSubscription {
        address agent;
        address payer;
        uint256 paidAt;
        uint256 expiresAt;
        uint256 amount;
        bool active;
    }

    struct AgentReview {
        address reviewer;
        address agent;
        bool positive;
        bytes32 commentHash;
        bytes32 proofTxHash;
        uint256 timestamp;
    }

    struct TrustSnapshot {
        address agent;
        uint256 score;
        uint256 timestamp;
        uint256 blockNumber;
        uint256[5] components; // uptime, erc8128, x402, interactions, age
    }

    struct SkillRecord {
        address agent;
        bytes32 skillFileHash;
        uint256 endpointCount;
        uint256 lastVerified;
    }

    struct FeeConfig {
        uint256 premiumFee;
        uint256 reviewFee;
        uint256 analyticsFee;
        uint256 compareFee;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    FeeConfig public fees;
    address public operator;
    address public treasury;

    mapping(address => PremiumSubscription) public premiumSubs;
    mapping(address => AgentReview[]) private agentReviews;
    mapping(address => mapping(address => bool)) public hasReviewedMap;
    mapping(address => TrustSnapshot[]) private trustHistory;
    mapping(address => SkillRecord) public skillRecords;
    mapping(address => mapping(address => bool)) public hasPaidAnalyticsMap;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PremiumActivated(address indexed agent, address indexed payer, uint256 expiresAt, uint256 amount);
    event ReviewSubmitted(address indexed reviewer, address indexed agent, bool positive, bytes32 commentHash, bytes32 proofTxHash);
    event TrustSnapshotRecorded(address indexed agent, uint256 score, uint256 blockNumber, uint256[5] components);
    event SkillVerified(address indexed agent, bytes32 skillFileHash, uint256 endpointCount, uint256 timestamp);
    event AnalyticsQueried(address indexed querier, address indexed agent, uint256 fee);
    event FeeUpdated(string feeType, uint256 newAmount);
    event TreasuryWithdraw(address indexed to, uint256 amount);
    event OperatorUpdated(address indexed newOperator);

    // ─── Modifier ─────────────────────────────────────────────────────────────

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner(), "Not operator");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _operator,
        address _treasury,
        uint256 _premiumFee,
        uint256 _reviewFee,
        uint256 _analyticsFee,
        uint256 _compareFee
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");
        usdc = IERC20(_usdc);
        operator = _operator != address(0) ? _operator : msg.sender;
        treasury = _treasury;
        fees = FeeConfig({
            premiumFee: _premiumFee,
            reviewFee: _reviewFee,
            analyticsFee: _analyticsFee,
            compareFee: _compareFee
        });
    }

    // ─── Write Functions ──────────────────────────────────────────────────────

    /// @notice Pay to activate premium tier for an agent (30 days).
    ///         The agent address must correspond to a valid ERC-8004 registered agent
    ///         — this is validated off-chain by the AGENTBOARD indexer before allowing payment.
    function payPremiumTier(address agent) external nonReentrant whenNotPaused {
        require(agent != address(0), "Invalid agent address");
        usdc.safeTransferFrom(msg.sender, address(this), fees.premiumFee);

        uint256 expiresAt = block.timestamp + PREMIUM_DURATION;
        premiumSubs[agent] = PremiumSubscription({
            agent: agent,
            payer: msg.sender,
            paidAt: block.timestamp,
            expiresAt: expiresAt,
            amount: fees.premiumFee,
            active: true
        });

        emit PremiumActivated(agent, msg.sender, expiresAt, fees.premiumFee);
    }

    /// @notice Submit a review for an agent.
    function submitReview(
        address agent,
        bool positive,
        bytes32 commentHash,
        bytes32 proofTxHash
    ) external nonReentrant whenNotPaused {
        require(agent != address(0), "Invalid agent address");
        require(!hasReviewedMap[msg.sender][agent], "Already reviewed this agent");
        require(msg.sender != agent, "Cannot review yourself");

        usdc.safeTransferFrom(msg.sender, address(this), fees.reviewFee);

        hasReviewedMap[msg.sender][agent] = true;
        agentReviews[agent].push(AgentReview({
            reviewer: msg.sender,
            agent: agent,
            positive: positive,
            commentHash: commentHash,
            proofTxHash: proofTxHash,
            timestamp: block.timestamp
        }));

        emit ReviewSubmitted(msg.sender, agent, positive, commentHash, proofTxHash);
    }

    /// @notice Record an immutable trust snapshot for an agent (operator only).
    function recordTrustSnapshot(
        address agent,
        uint256 score,
        uint256[5] calldata components
    ) external onlyOperator {
        require(agent != address(0), "Invalid agent address");
        require(score <= 100, "Score must be 0-100");

        trustHistory[agent].push(TrustSnapshot({
            agent: agent,
            score: score,
            timestamp: block.timestamp,
            blockNumber: block.number,
            components: components
        }));

        emit TrustSnapshotRecorded(agent, score, block.number, components);
    }

    /// @notice Record onchain verification of an agent's SKILL.md hash (operator only).
    function recordSkillVerification(
        address agent,
        bytes32 skillFileHash,
        uint256 endpointCount
    ) external onlyOperator {
        require(agent != address(0), "Invalid agent address");

        skillRecords[agent] = SkillRecord({
            agent: agent,
            skillFileHash: skillFileHash,
            endpointCount: endpointCount,
            lastVerified: block.timestamp
        });

        emit SkillVerified(agent, skillFileHash, endpointCount, block.timestamp);
    }

    /// @notice Query deep analytics for an agent (costs analyticsFee).
    function queryAgentAnalytics(address agent) external nonReentrant whenNotPaused {
        require(agent != address(0), "Invalid agent address");
        usdc.safeTransferFrom(msg.sender, address(this), fees.analyticsFee);
        hasPaidAnalyticsMap[msg.sender][agent] = true;
        emit AnalyticsQueried(msg.sender, agent, fees.analyticsFee);
    }

    /// @notice Compare two agents (costs compareFee).
    function compareAgents(address agentA, address agentB) external nonReentrant whenNotPaused {
        require(agentA != address(0) && agentB != address(0), "Invalid agent address");
        require(agentA != agentB, "Cannot compare agent with itself");
        usdc.safeTransferFrom(msg.sender, address(this), fees.compareFee);
        emit AnalyticsQueried(msg.sender, agentA, fees.compareFee);
        emit AnalyticsQueried(msg.sender, agentB, fees.compareFee);
    }

    /// @notice Update a fee type (owner only).
    function updateFee(string calldata feeType, uint256 newAmount) external onlyOwner {
        bytes32 feeHash = keccak256(bytes(feeType));
        if (feeHash == keccak256("premium")) {
            fees.premiumFee = newAmount;
        } else if (feeHash == keccak256("review")) {
            fees.reviewFee = newAmount;
        } else if (feeHash == keccak256("analytics")) {
            fees.analyticsFee = newAmount;
        } else if (feeHash == keccak256("compare")) {
            fees.compareFee = newAmount;
        } else {
            revert("Unknown fee type");
        }
        emit FeeUpdated(feeType, newAmount);
    }

    /// @notice Withdraw accumulated USDC to treasury (owner only).
    function withdrawTreasury() external onlyOwner nonReentrant {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        usdc.safeTransfer(treasury, balance);
        emit TreasuryWithdraw(treasury, balance);
    }

    /// @notice Update operator address (owner only).
    function setOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), "Zero address");
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    /// @notice Update treasury address (owner only).
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Zero address");
        treasury = newTreasury;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Read Functions ───────────────────────────────────────────────────────

    function isPremium(address agent) external view returns (bool active, uint256 expiresAt) {
        PremiumSubscription storage sub = premiumSubs[agent];
        active = sub.active && block.timestamp < sub.expiresAt;
        expiresAt = sub.expiresAt;
    }

    function getReviews(address agent) external view returns (AgentReview[] memory) {
        return agentReviews[agent];
    }

    function getReviewSummary(address agent) external view returns (uint256 positive, uint256 negative) {
        AgentReview[] storage reviews = agentReviews[agent];
        for (uint256 i = 0; i < reviews.length; i++) {
            if (reviews[i].positive) { positive++; } else { negative++; }
        }
    }

    function getTrustHistory(address agent, uint256 limit) external view returns (TrustSnapshot[] memory) {
        TrustSnapshot[] storage history = trustHistory[agent];
        uint256 len = history.length;
        uint256 returnLen = limit == 0 || limit > len ? len : limit;
        TrustSnapshot[] memory result = new TrustSnapshot[](returnLen);
        for (uint256 i = 0; i < returnLen; i++) {
            result[i] = history[len - 1 - i];
        }
        return result;
    }

    function getSkillRecord(address agent) external view returns (SkillRecord memory) {
        return skillRecords[agent];
    }

    function getFees() external view returns (FeeConfig memory) {
        return fees;
    }

    function hasReviewed(address reviewer, address agent) external view returns (bool) {
        return hasReviewedMap[reviewer][agent];
    }

    function hasPaidAnalytics(address querier, address agent) external view returns (bool) {
        return hasPaidAnalyticsMap[querier][agent];
    }

    function getTrustSnapshotCount(address agent) external view returns (uint256) {
        return trustHistory[agent].length;
    }

    function getReviewCount(address agent) external view returns (uint256) {
        return agentReviews[agent].length;
    }
}
