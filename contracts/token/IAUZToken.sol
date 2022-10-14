pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAdvancedAUZToken is IERC20 {
    function delegateTransferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function delegateApprove(address owner, uint256 amount)
        external
        returns (bool);
}
