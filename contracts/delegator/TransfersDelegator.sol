// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TransfersDelegator is Ownable {

}



// /**
//  * @title AdvancedOToken
//  * @author Phoenix
//  */
// contract AdvancedAUZToken is AUZToken {
//     address public hotWallet;

//     mapping(address => mapping(bytes32 => bool)) public tokenUsed; // mapping to track token is used or not

//     bytes4 public methodWord_transfer =
//         bytes4(keccak256("transfer(address,uint256)"));
//     bytes4 public methodWord_approve =
//         bytes4(keccak256("approve(address,uint256)"));
//     bytes4 public methodWord_increaseApproval =
//         bytes4(keccak256("increaseAllowance(address,uint256)"));
//     bytes4 public methodWord_decreaseApproval =
//         bytes4(keccak256("decreaseAllowance(address,uint256)"));

//     constructor(
//         address _sellingWallet,
//         address _minter,
//         address _feeWallet
//     ) AUZToken(_sellingWallet, _minter, _feeWallet) {}

//     /**
//      * @dev ID of the executing chain
//      * @return uint value
//      */
//     function getChainID() public view returns (uint256) {
//         uint256 id;
//         assembly {
//             id := chainid()
//         }
//         return id;
//     }

//     function updateHotWallet (address _hotWallet) external onlyOwner {
//         require(_hotWallet != address(0), "Zero address is not allowed");
//         hotWallet = _hotWallet;
//     }

//     /**
//      * @notice Validates the message and signature
//      * @param proof The message that was expected to be signed by user
//      * @param message The message that user signed
//      * @param signature Signature
//      * @param token The unique token for each delegated function
//      * @return address Signer of message
//      */
//     function preAuthValidations(
//         bytes32 proof,
//         bytes32 message,
//         bytes32 token,
//         bytes memory signature
//     ) private returns (address) {
//         address signer = getSigner(message, signature);
//         require(signer != address(0), "Zero address not allowed");
//         require(!tokenUsed[signer][token], "Token already used");
//         require(proof == message, "Invalid proof");
//         tokenUsed[signer][token] = true;
//         return signer;
//     }

//     /**
//      * @notice Find signer
//      * @param message The message that user signed
//      * @param signature Signature
//      * @return address Signer of message
//      */
//     function getSigner(
//         bytes32 message,
//         bytes memory signature
//     ) public pure returns (address) {
//         message = ECDSA.toEthSignedMessageHash(message);
//         address signer = ECDSA.recover(message, signature);
//         return signer;
//     }

//     /**
//      * @notice Delegated transfer. Gas fee will be paid by relayer
//      * @param message The message that user signed
//      * @param signature Signature
//      * @param token The unique token for each delegated function
//      * @param networkFee The fee that will be paid to relayer for gas fee he spends
//      * @param to The array of recipients
//      * @param amount The array of amounts to be transferred
//      */
//     function preAuthorizedTransfer(
//         bytes32 message,
//         bytes memory signature,
//         bytes32 token,
//         uint256 networkFee,
//         address to,
//         uint256 amount
//     ) public {
//         bytes32 proof = getProofTransfer(
//             methodWord_transfer,
//             token,
//             networkFee,
//             msg.sender,
//             to,
//             amount
//         );
//         address signer = preAuthValidations(proof, message, token, signature);

//         // Deduct network fee if broadcaster charges network fee
//         if (networkFee > 0) {
//             _privateTransfer(signer, msg.sender, networkFee);
//         }
//         _privateTransfer(signer, to, amount);
//         emit TransferPreSigned(signer, to, amount, networkFee);
//     }

//     /**
//      * @notice Delegated approval. Gas fee will be paid by relayer
//      * @dev Only approve, increaseApproval and decreaseApproval can be delegated
//      * @param message The message that user signed
//      * @param signature Signature
//      * @param token The unique token for each delegated function
//      * @param networkFee The fee that will be paid to relayer for gas fee he spends
//      * @param to The spender address
//      * @param amount The amount to be allowed
//      * @return Bool value
//      */
//     function preAuthorizedApproval(
//         bytes4 methodHash,
//         bytes32 message,
//         bytes memory signature,
//         bytes32 token,
//         uint256 networkFee,
//         address to,
//         uint256 amount
//     ) public returns (bool) {
//         bytes32 proof = getProofApproval(
//             methodHash,
//             token,
//             networkFee,
//             msg.sender,
//             to,
//             amount
//         );
//         address signer = preAuthValidations(proof, message, token, signature);
//         uint256 currentAllowance = allowance(signer, _msgSender());
//         // Perform approval
//         if (methodHash == methodWord_approve) _approve(signer, to, amount);
//         else if (methodHash == methodWord_increaseApproval)
//             _approve(signer, to, currentAllowance + amount);
//         else if (methodHash == methodWord_decreaseApproval)
//             _approve(signer, to, currentAllowance - amount);
//         return true;
//     }

//     /**
//      * @notice Get the message to be signed in case of delegated transfer/approvals
//      * @param methodHash The method hash for which delegate action in to be performed
//      * @param token The unique token for each delegated function
//      * @param networkFee The fee that will be paid to relayer for gas fee he spends
//      * @param to The recipient or spender
//      * @param amount The amount to be transferred
//      * @return Bool value
//      */
//     function getProofTransfer(
//         bytes4 methodHash,
//         bytes32 token,
//         uint256 networkFee,
//         address broadcaster,
//         address to,
//         uint256 amount
//     ) public view returns (bytes32) {
//         require(methodHash == methodWord_transfer, "Method not supported");
//         bytes32 proof = keccak256(
//             abi.encodePacked(
//                 getChainID(),
//                 bytes4(methodHash),
//                 address(this),
//                 token,
//                 networkFee,
//                 broadcaster,
//                 to,
//                 amount
//             )
//         );
//         return proof;
//     }

//     /**
//      * @notice Get the message to be signed in case of delegated transfer/approvals
//      * @param methodHash The method hash for which delegate action in to be performed
//      * @param token The unique token for each delegated function
//      * @param networkFee The fee that will be paid to relayer for gas fee he spends
//      * @param to The recipient or spender
//      * @param amount The amount to be approved
//      * @return Bool value
//      */
//     function getProofApproval(
//         bytes4 methodHash,
//         bytes32 token,
//         uint256 networkFee,
//         address broadcaster,
//         address to,
//         uint256 amount
//     ) public view returns (bytes32) {
//         require(
//             methodHash == methodWord_approve ||
//                 methodHash == methodWord_increaseApproval ||
//                 methodHash == methodWord_decreaseApproval,
//             "Method not supported"
//         );
//         bytes32 proof = keccak256(
//             abi.encodePacked(
//                 getChainID(),
//                 bytes4(methodHash),
//                 address(this),
//                 token,
//                 networkFee,
//                 broadcaster,
//                 to,
//                 amount
//             )
//         );
//         return proof;
//     }

//     function sellGoldWithHotWallet (address _from, uint256 _amount) external returns (bool) {
//         require(msg.sender == hotWallet, "Only hot wallet can execute this function");
//         _privateTransfer(_from, hotWallet, _amount);
//         return true;
//     }
// }