// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Add_Swap_Contract {
    ISwapRouter public immutable swapRouter;
    INonfungiblePositionManager public immutable positionManager;

    address public token0;
    address public token1;
    uint24 public fee = 500; // 0.05%

    constructor(
        address _swapRouter,
        address _positionManager,
        address _token0,
        address _token1
    ) {
        swapRouter = ISwapRouter(_swapRouter);
        positionManager = INonfungiblePositionManager(_positionManager);
        token0 = _token0;
        token1 = _token1;
    }

    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 tokenId) {
        // Transfer tokens to this contract
        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);

        // Approve Position Manager
        IERC20(token0).approve(address(positionManager), amount0Desired);
        IERC20(token1).approve(address(positionManager), amount1Desired);

        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: -887220, // min tick
            tickUpper: 887220,  // max tick
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,
            amount1Min: 0,
            recipient: msg.sender,
            deadline: block.timestamp + 120
        });

        (tokenId,,,) = positionManager.mint(params);
    }

    function swapExactInputSingle(
        address inputToken,
        address outputToken,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        IERC20(inputToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(inputToken).approve(address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: inputToken,
            tokenOut: outputToken,
            fee: fee,
            recipient: msg.sender,
            deadline: block.timestamp + 60,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);
    }
}
