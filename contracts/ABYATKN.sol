//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
// import "@openzeppelin/contracts/access/Ownable.sol";

contract ABYATKN is ERC20 {
  uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18; // 10 billion tokens with 18 decimals
  uint256 public constant INITIAL_SUPPLY = 1000000000 * 10 ** 18; // 1 billion tokens with 18 decimals

  constructor() ERC20('ABYATKN', 'ABYTKN') {
    require(INITIAL_SUPPLY <= MAX_SUPPLY, "Initial supply exceeds max supply");
    _mint(msg.sender, INITIAL_SUPPLY);
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }

  //transfer function
  function transfer(address recipient, uint256 amount) public override returns (bool) {
    require(recipient != address(0), "Transfer to the zero address");
    require(amount > 0, "Transfer amount must be greater than zero");
    require(amount <= balanceOf(msg.sender), "Insufficient balance");
    return super.transfer(recipient, amount);
  }

  function burn(uint256 amount) public {
    require(amount > 0, "Burn amount must be greater than zero");
    _burn(msg.sender, amount);
  }

}
