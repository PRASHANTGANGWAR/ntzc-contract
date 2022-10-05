pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
  constructor (string memory _name, string memory _symbol, uint8 _dec) ERC20(_name, _symbol){
      _decimals = _dec;
  }
  
  uint8 _decimals;
  mapping (address => bool) public minters;


  function mint (address _addr, uint256 _amount) external {
    _mint(_addr, _amount);
  }

  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }

}
