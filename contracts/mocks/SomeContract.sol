// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SomeContract {
    function someFunction(address token) external returns (uint) {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}