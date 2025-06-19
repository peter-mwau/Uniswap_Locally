// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Add_Swap_Contract {
    ISwapRouter public immutable swapRouter;
    INonfungiblePositionManager public immutable positionManager;

    address public token0;
    address public token1;
    uint24 public fee = 500; // 0.05%

    // Enum for transaction types
    enum TransactionType { LIQUIDITY, SWAP }

    event TransactionAdded(uint256 indexed id, TransactionType indexed transactionType, bytes32 txHash);
    
    // Transaction history struct
    struct Transaction {
        uint256 id;
        TransactionType transactionType;
        string fromToken;
        string toToken;
        uint256 fromAmount;
        uint256 toAmount;
        uint256 timestamp;
        bytes32 hash;
        string status;
    }
    
    // Array to store transaction history
    Transaction[] public txHistory;

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

    /// @notice Add liquidity to the pool
    /// @param amount0Desired Desired amount of token0
    /// @param amount1Desired Desired amount of token1
    /// @return tokenId The ID of the NFT representing the liquidity position
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

    /// @notice Swap tokens in the pool
    /// @param inputToken The token being swapped
    /// @param outputToken The token being received
    /// @param amountIn The amount of inputToken to swap
    /// @return amountOut The amount of outputToken received
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

    /// @notice Get pool information
    /// @param pool The address of the pool
    /// @return sqrtPriceX96 Current square root price
    /// @return tick Current tick
    /// @return liquidity Current liquidity in the pool
    function getPoolInfo(address pool) external view returns (uint160 sqrtPriceX96, int24 tick, uint128 liquidity) {
        (sqrtPriceX96, tick,,,,,) = IUniswapV3Pool(pool).slot0();
        liquidity = IUniswapV3Pool(pool).liquidity();
    }

    /// @notice Get token balances in the pool
    /// @param pool The address of the pool
    /// @return bal0 Balance of token0 in the pool
    /// @return bal1 Balance of token1 in the pool
    function getPoolBalances(address pool) external view returns (uint256 bal0, uint256 bal1) {
        bal0 = IERC20(token0).balanceOf(pool);
        bal1 = IERC20(token1).balanceOf(pool);
    }

    /// @notice Get a user's NFT position info
    /// @param tokenId The ID of the NFT representing the liquidity position
    /// @return liquidity The liquidity provided by the user
    function getPosition(uint256 tokenId) external view returns (uint128 liquidity) {
        (,,,,,,, liquidity,,,,) = positionManager.positions(tokenId);
    }

    /// @notice Get price of token0 relative to token1
    /// @param pool The address of the pool
    /// @return price The price of token0 in terms of token1
    function getTokenPrice(address pool) external view returns (uint256 price) {
        (uint160 sqrtPriceX96,,,,,,) = IUniswapV3Pool(pool).slot0();
        price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) / (2**192);
    }

     /// @notice Add a transaction to history
    /// @param transactionType Type of transaction (LIQUIDITY or SWAP)
    /// @param fromToken Symbol of the input token
    /// @param toToken Symbol of the output token
    /// @param fromAmount Amount of input token
    /// @param toAmount Amount of output token
    /// @param txHash Transaction hash
    function addTransactionToHistory(
        TransactionType transactionType,
        string memory fromToken,
        string memory toToken,
        uint256 fromAmount,
        uint256 toAmount,
        bytes32 txHash
    ) public {
        Transaction memory newTx = Transaction({
            id: txHistory.length + 1,
            transactionType: transactionType,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: fromAmount,
            toAmount: toAmount,
            timestamp: block.timestamp,
            hash: txHash,
            status: "confirmed"
        });
        
        txHistory.push(newTx);

        emit TransactionAdded(newTx.id, transactionType, txHash);
    }
    
    /// @notice Get all transaction history
    /// @return Transaction array containing all transactions
    function getTransactionHistory() public view returns (Transaction[] memory) {
        return txHistory;
    }
}