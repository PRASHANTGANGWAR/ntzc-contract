pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAdvancedAUZToken is IERC20 {
    function sellGoldWithHotWallet(address _from, uint256 _amount)
        external
        returns (bool);
}
