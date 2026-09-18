// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZionTacticalVault is Ownable {
    IERC20 public immutable usdc;
    uint256 public maxDailyLossBps = 500;
    uint256 public tacticalAllocationCap;
    uint256 public currentDayLoss;
    uint256 public lastResetTimestamp;
    address public aiSigner;

    event TradeExecuted(address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event CircuitBreakerTriggered(string reason);

    modifier onlyAuthorizedAgent() {
        require(msg.sender == aiSigner || msg.sender == owner(), "Unauthorized agent");
        _;
    }

    constructor(address _usdc, address _aiSigner, uint256 _cap) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        aiSigner = _aiSigner;
        tacticalAllocationCap = _cap;
        lastResetTimestamp = block.timestamp;
    }

    function setAISigner(address _newSigner) external onlyOwner {
        aiSigner = _newSigner;
    }

    function resetDailyMetricsIfNeeded() internal {
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            currentDayLoss = 0;
            lastResetTimestamp = block.timestamp;
        }
    }

    function executeTacticalSwap(
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 expectedLoss
    ) external onlyAuthorizedAgent {
        resetDailyMetricsIfNeeded();
        require(amountIn <= tacticalAllocationCap, "Exceeds tactical cap");
        require(currentDayLoss + expectedLoss <= (tacticalAllocationCap * maxDailyLossBps) / 10000, "Circuit breaker max loss reached");

        currentDayLoss += expectedLoss;
        emit TradeExecuted(tokenOut, amountIn, minAmountOut);
    }
}
