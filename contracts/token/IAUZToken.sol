pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAUZToken is IERC20 {
    function delegateTransferFrom(
        address sender,
        address recipient,
        uint256 amount,
        address broadcaster,
        uint256 networkFee,
        bool feeMode
    ) external returns (bool);

    function delegateApprove(
        address owner,
        uint256 amount,
        address broadcaster,
        uint256 networkFee
    ) external returns (bool);
}
