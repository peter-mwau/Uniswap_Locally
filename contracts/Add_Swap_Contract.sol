// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Add_Swap_Contract {
    ISwapRouter public immutable swapRouter;
    INonfungiblePositionManager public immutable positionManager;
    IUniswapV3Pool public immutable pool;

    address public token0;
    address public token1;
    uint24 public fee = 500; // 0.05%

    // Enum for transaction types
    enum TransactionType { LIQUIDITY, SWAP }

    mapping(address => Transaction[]) private userTxHistory;
    mapping(address => uint256[]) private userPositions;

    event TransactionAdded(uint256 indexed id, TransactionType indexed transactionType, bytes32 txHash, address indexed user);

    uint256 nextTransactionId;
    
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
    
    Transaction[] public allTransactions;

    constructor(
        address _swapRouter,
        address _positionManager,
        address _pool
    ) {
        swapRouter = ISwapRouter(_swapRouter);
        positionManager = INonfungiblePositionManager(_positionManager);
        pool = IUniswapV3Pool(_pool);
        
        token0 = pool.token0();
        token1 = pool.token1();
        fee = pool.fee();

        nextTransactionId = 1;
    }

    // Helper function to convert address to string
    function addressToString(address _addr) internal pure returns (string memory) {
        return toString(abi.encodePacked(_addr));
    }

    // Helper function to convert bytes to string
    function toString(bytes memory data) internal pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[2+1+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    // Helper function to get current tick and calculate safe range
    function getSafeTickRange() internal view returns (int24 tickLower, int24 tickUpper) {
        (, int24 currentTick,,,,,) = pool.slot0();
        
        // Create a wide range around current tick
        int24 tickSpacing = 10; // Common tick spacing for 0.05% fee
        
        // Calculate range (about ±50% from current price)
        int24 tickRange = 4000; // Approximately 50% price movement
        
        // Ensure ticks are properly spaced
        tickLower = ((currentTick - tickRange) / tickSpacing) * tickSpacing;
        tickUpper = ((currentTick + tickRange) / tickSpacing) * tickSpacing;
        
        // Ensure within bounds
        if (tickLower < -887220) tickLower = -887220;
        if (tickUpper > 887220) tickUpper = 887220;
    }

    /// @notice Add liquidity to the pool
    /// @param amount0Desired Desired amount of token0
    /// @param amount1Desired Desired amount of token1
    /// @return tokenId The ID of the NFT representing the liquidity position
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 tokenId) {
        require(amount0Desired > 0 || amount1Desired > 0, "Must provide non-zero amount");
        
        // Transfer tokens to this contract
        if (amount0Desired > 0) {
            IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
            IERC20(token0).approve(address(positionManager), amount0Desired);
        }
        
        if (amount1Desired > 0) {
            IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);
            IERC20(token1).approve(address(positionManager), amount1Desired);
        }

        // Get safe tick range based on current price
        (int24 tickLower, int24 tickUpper) = getSafeTickRange();

        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0, // Accept any amount of token0
            amount1Min: 0, // Accept any amount of token1
            recipient: msg.sender,
            deadline: block.timestamp + 300 // 5 minutes
        });

        (tokenId,,,) = positionManager.mint(params);

        userPositions[msg.sender].push(tokenId);

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, amount0Desired, amount1Desired, tokenId));

        // Record the transaction
        Transaction memory newTx = Transaction({
            id: nextTransactionId,
            transactionType: TransactionType.LIQUIDITY,
            fromToken: addressToString(token0),
            toToken: addressToString(token1),
            fromAmount: amount0Desired,
            toAmount: amount1Desired,
            timestamp: block.timestamp,
            hash: txHash,
            status: "confirmed"
        });
        
        allTransactions.push(newTx);
        userTxHistory[msg.sender].push(newTx);
        nextTransactionId++;
        
        emit TransactionAdded(newTx.id, TransactionType.LIQUIDITY, newTx.hash, msg.sender);
        
        return tokenId;
    }

    /// @notice Add liquidity with custom tick range
    /// @param amount0Desired Desired amount of token0
    /// @param amount1Desired Desired amount of token1
    /// @param tickLower Lower tick of the range
    /// @param tickUpper Upper tick of the range
    /// @return tokenId The ID of the NFT representing the liquidity position
    function addLiquidityWithRange(
        uint256 amount0Desired,
        uint256 amount1Desired,
        int24 tickLower,
        int24 tickUpper
    ) external returns (uint256 tokenId) {
        require(amount0Desired > 0 || amount1Desired > 0, "Must provide non-zero amount");
        require(tickLower < tickUpper, "Invalid tick range");
        
        // Transfer tokens to this contract
        if (amount0Desired > 0) {
            IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
            IERC20(token0).approve(address(positionManager), amount0Desired);
        }
        
        if (amount1Desired > 0) {
            IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);
            IERC20(token1).approve(address(positionManager), amount1Desired);
        }

        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,
            amount1Min: 0,
            recipient: msg.sender,
            deadline: block.timestamp + 300
        });

        (tokenId,,,) = positionManager.mint(params);

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, amount0Desired, amount1Desired, tokenId));

        Transaction memory newTx = Transaction({
            id: nextTransactionId,
            transactionType: TransactionType.LIQUIDITY,
            fromToken: addressToString(token0),
            toToken: addressToString(token1),
            fromAmount: amount0Desired,
            toAmount: amount1Desired,
            timestamp: block.timestamp,
            hash: txHash,
            status: "confirmed"
        });
        
        allTransactions.push(newTx);
        userTxHistory[msg.sender].push(newTx);
        nextTransactionId++;
        
        emit TransactionAdded(newTx.id, TransactionType.LIQUIDITY, newTx.hash, msg.sender);
        
        return tokenId;
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
        require(inputToken == token0 || inputToken == token1, "Invalid input token");
        require(outputToken == token0 || outputToken == token1, "Invalid output token");
        require(inputToken != outputToken, "Cannot swap same token");
        
        IERC20(inputToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(inputToken).approve(address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: inputToken,
            tokenOut: outputToken,
            fee: fee,
            recipient: msg.sender,
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, inputToken, outputToken, amountIn));
        
        Transaction memory newTx = Transaction({
            id: nextTransactionId,
            transactionType: TransactionType.SWAP,
            fromToken: addressToString(inputToken),
            toToken: addressToString(outputToken),
            fromAmount: amountIn,
            toAmount: amountOut,
            timestamp: block.timestamp,
            hash: txHash,
            status: "confirmed"
        });
        
        allTransactions.push(newTx);
        userTxHistory[msg.sender].push(newTx);
        nextTransactionId++;
        
        emit TransactionAdded(newTx.id, TransactionType.SWAP, newTx.hash, msg.sender);
        
        return amountOut;
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
            id: nextTransactionId,
            transactionType: transactionType,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: fromAmount,
            toAmount: toAmount,
            timestamp: block.timestamp,
            hash: txHash,
            status: "confirmed"
        });
        
        allTransactions.push(newTx);

        userTxHistory[msg.sender].push(newTx);

        nextTransactionId++; // Increment the transaction ID for the next transaction

        emit TransactionAdded(newTx.id, transactionType, txHash, msg.sender);
    }

    function approvePositionManager(uint256 tokenId) external {
    // Ensure caller is the owner
    require(positionManager.ownerOf(tokenId) == msg.sender, "Not position owner");
    
    // User approves this contract to manage the position
    positionManager.approve(address(this), tokenId);
}

    /// @notice Collect accumulated fees from a position
/// @param tokenId The ID of the NFT for which fees are being collected
/// @return amount0 The amount of token0 fees collected
/// @return amount1 The amount of token1 fees collected
function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
    // Must be owner of the position
    require(positionManager.ownerOf(tokenId) == msg.sender, "Not position owner");
    // Check if this contract is approved
    require(
        positionManager.getApproved(tokenId) == address(this) || 
        positionManager.isApprovedForAll(msg.sender, address(this)),
        "Contract not approved to manage this position"
    );
    
    INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
        tokenId: tokenId,
        recipient: msg.sender,
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
    });

    (amount0, amount1) = positionManager.collect(params);
}

/// @notice Remove liquidity from a position
/// @param tokenId The ID of the NFT representing the position
/// @param liquidity The amount of liquidity to remove
/// @return amount0 The amount of token0 received
/// @return amount1 The amount of token1 received
function removeLiquidity(uint256 tokenId, uint128 liquidity) external returns (uint256 amount0, uint256 amount1) {
    // Must be owner of the position
    require(positionManager.ownerOf(tokenId) == msg.sender, "Not position owner");
    
    INonfungiblePositionManager.DecreaseLiquidityParams memory decreaseParams = INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: tokenId,
        liquidity: liquidity,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp + 300
    });

    (amount0, amount1) = positionManager.decreaseLiquidity(decreaseParams);
    
    // Collect any remaining fees
    this.collectFees(tokenId);
}


function getPositionDetails(uint256 tokenId) external view returns (
    address positionToken0,
    address positionToken1,
    uint128 liquidity,
    uint256 feeGrowthInside0LastX128,
    uint256 feeGrowthInside1LastX128,
    uint128 tokensOwed0,
    uint128 tokensOwed1
) {
    
    (
        ,                          // uint96 nonce
        ,                          // address operator
        positionToken0,            // address token0 (renamed)
        positionToken1,                     // address token1
        ,                          // uint24 fee
        ,                          // int24 tickLower
        ,                          // int24 tickUpper
        liquidity,                 // uint128 liquidity
        feeGrowthInside0LastX128,  // uint256 feeGrowthInside0LastX128
        feeGrowthInside1LastX128,  // uint256 feeGrowthInside1LastX128
        tokensOwed0,               // uint128 tokensOwed0
        tokensOwed1                // uint128 tokensOwed1
    ) = positionManager.positions(tokenId);
}

/// @notice Get the current fees earned by a position
/// @param tokenId The ID of the NFT position
/// @return fees0 The amount of token0 fees earned
/// @return fees1 The amount of token1 fees earned
function getPositionFees(uint256 tokenId) external view returns (uint256 fees0, uint256 fees1) {
    // Get position details - match the exact structure returned by positions
    (
        ,                   // uint96 nonce
        ,                   // address operator
        ,                   // address token0
        ,                   // address token1
        ,                   // uint24 fee
        ,                   // int24 tickLower
        ,                   // int24 tickUpper
        uint128 liquidity,  // uint128 liquidity
        uint256 feeGrowthInside0LastX128,  // uint256 feeGrowthInside0LastX128
        uint256 feeGrowthInside1LastX128,  // uint256 feeGrowthInside1LastX128
        uint128 tokensOwed0,  // uint128 tokensOwed0
        uint128 tokensOwed1   // uint128 tokensOwed1
    ) = positionManager.positions(tokenId);
    
    // Get global fee growth
    uint256 feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128();
    uint256 feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128();
    
    // Calculate pending fees (simplified calculation)
    fees0 = tokensOwed0;
    if (liquidity > 0) {
        fees0 += uint256(uint128(
            (feeGrowthGlobal0X128 - feeGrowthInside0LastX128) * liquidity / 2**128
        ));
    }
    
    fees1 = tokensOwed1;
    if (liquidity > 0) {
        fees1 += uint256(uint128(
            (feeGrowthGlobal1X128 - feeGrowthInside1LastX128) * liquidity / 2**128
        ));
    }
}

    /// @notice Get pool information
    /// @return sqrtPriceX96 Current square root price
    /// @return tick Current tick
    /// @return liquidity Current liquidity in the pool
    function getPoolInfo() external view returns (uint160 sqrtPriceX96, int24 tick, uint128 liquidity) {
        (sqrtPriceX96, tick,,,,,) = pool.slot0();
        liquidity = pool.liquidity();
    }

    /// @notice Get token balances in the pool
    /// @return bal0 Balance of token0 in the pool
    /// @return bal1 Balance of token1 in the pool
    function getPoolBalances() external view returns (uint256 bal0, uint256 bal1) {
        bal0 = IERC20(token0).balanceOf(address(pool));
        bal1 = IERC20(token1).balanceOf(address(pool));
    }

    /// @notice Get a user's NFT position info
    /// @param tokenId The ID of the NFT representing the liquidity position
    /// @return liquidity The liquidity provided by the user
    function getPosition(uint256 tokenId) external view returns (uint128 liquidity) {
        (,,,,,,, liquidity,,,,) = positionManager.positions(tokenId);
    }

    function getUserPositions() external view returns (uint256[] memory) {
    return userPositions[msg.sender];
}

// Function to check if a user owns a specific position
function ownsPosition(address user, uint256 tokenId) public view returns (bool) {
    uint256[] memory positions = userPositions[user];
    for (uint i = 0; i < positions.length; i++) {
        if (positions[i] == tokenId) {
            return true;
        }
    }
    return false;
}

    /// @notice Get price of token0 relative to token1
    /// @return price The price of token0 in terms of token1
    function getTokenPrice() external view returns (uint256 price) {
        (uint160 sqrtPriceX96,,,,,,) = pool.slot0();
        price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) / (2**192);
    }

    /// @notice Get current tick from pool
    /// @return tick Current tick
    function getCurrentTick() external view returns (int24 tick) {
        (, tick,,,,,) = pool.slot0();
    }

    /// @notice Get all transaction history
    /// @return Transaction array containing all transactions
    function getAllTransactionHistory() public view returns (Transaction[] memory) {
        return allTransactions;
    }

    /// @notice Get user transaction history
    /// @return Transaction array containing user's transactions
    function getUserTransactionHistory(address _user) public view returns (Transaction[] memory) {
        return userTxHistory[_user];
    }

    /// @notice Get pool address
    /// @return pool address
    function getPool() external view returns (address) {
        return address(pool);
    }
}