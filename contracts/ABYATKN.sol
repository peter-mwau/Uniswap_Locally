//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract ABYATKN is ERC20, Ownable {
  // uint256 public constant MAX_SUPPLY = 1000000000 * 10 ** 18; // 1 billion tokens with 18 decimals
  // uint256 public constant INITIAL_SUPPLY = 10000000000 * 10 ** 18; // 10 billion tokens with 18 decimals

  constructor() ERC20('ABYATKN', 'ABYTKN') {
    // require(INITIAL_SUPPLY <= MAX_SUPPLY, "Initial supply exceeds max supply");
    // _mint(msg.sender, INITIAL_SUPPLY);
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
