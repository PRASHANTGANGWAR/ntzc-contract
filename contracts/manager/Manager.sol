// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../token/IAUZToken.sol";

contract Manager is Initializable, OwnableUpgradeable {
    address public azx;

    mapping(address => bool) public managers;
    mapping(address => mapping(bytes32 => bool)) public tokenUsed; // mapping to track token is used or not

    bytes4 public methodWord_transfer;
    bytes4 public methodWord_approve;

    modifier onlyManager() {
        require(
            managers[msg.sender] || msg.sender == owner(),
            "Manager: Only managers is allowed"
        );
        _;
    }

    function initialize() external initializer {
        __Ownable_init();

        managers[msg.sender] = true;
        methodWord_transfer = bytes4(keccak256("transfer(address,uint256)"));
        methodWord_approve = bytes4(keccak256("approve(address,uint256)"));
    }

    /**
     * @dev ID of the executing chain
     * @return uint value
     */
    function getChainID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
     * @notice Update address of AZX token
     * @dev Only owner can call
     * @param _azx The AZX contract address
     */
    function updateAZX(address _azx) public onlyOwner {
        require(_azx != address(0), "Manager: Zero address is not allowed");
        azx = _azx;
    }

    /**
     * @notice Update managers roles for addresses
     * @dev Only owner can call
     * @param _manager The wallet of the user
     * @param _isManager Bool variable that indicates is wallet is manager or not
     */
    function updateManagers(address _manager, bool _isManager)
        external
        onlyOwner
    {
        managers[_manager] = _isManager;
    }

    /**
     * @notice Validates the message and signature
     * @param proof The message that was expected to be signed by user
     * @param message The message that user signed
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @return address Signer of message
     */
    function preAuthValidations(
        bytes32 proof,
        bytes32 message,
        bytes32 token,
        bytes memory signature
    ) private returns (address) {
        address signer = getSigner(message, signature);
        require(signer != address(0), "Manager: Zero address not allowed");
        require(!tokenUsed[signer][token], "Manager: Token already used");
        require(proof == message, "Manager: Invalid proof");
        tokenUsed[signer][token] = true;
        return signer;
    }

    /**
     * @notice Find signer
     * @param message The message that user signed
     * @param signature Signature
     * @return address Signer of message
     */
    function getSigner(bytes32 message, bytes memory signature)
        public
        pure
        returns (address)
    {
        message = ECDSA.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(message, signature);
        return signer;
    }

    /**
     * @notice Get the message to be signed in case of delegated transfer/approvals
     * @param methodHash The method hash for which delegate action in to be performed
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param to The recipient or spender
     * @param amount The amount to be transferred
     * @return Bool value
     */
    function getProof(
        bytes4 methodHash,
        bytes32 token,
        uint256 networkFee,
        address to,
        uint256 amount
    ) public view returns (bytes32) {
        bytes32 proof = keccak256(
            abi.encodePacked(
                getChainID(),
                bytes4(methodHash),
                address(this),
                token,
                networkFee,
                to,
                amount
            )
        );
        return proof;
    }

    /**
     * @notice Delegated approval. Gas fee will be paid by relayer
     * @dev Only approve, increaseApproval and decreaseApproval can be delegated
     * @param message The message that user signed
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param amount The amount to be allowed
     * @return Bool value
     */
    function preAuthorizedApproval(
        bytes32 message,
        bytes memory signature,
        bytes32 token,
        uint256 networkFee,
        uint256 amount
    ) public onlyManager returns (bool) {
        bytes32 proof = getProof(
            methodWord_approve,
            token,
            networkFee,
            address(this),
            amount
        );
        address signer = preAuthValidations(proof, message, token, signature);

        IAUZToken(azx).delegateApprove(signer, amount, msg.sender, networkFee);

        return true;
    }

    /**
     * @notice Delegated transfer. Gas fee will be paid by relayer
     * @param message The message that user signed
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param to The array of recipients
     * @param amount The array of amounts to be transferred
     */
    function preAuthorizedTransfer(
        bytes32 message,
        bytes memory signature,
        bytes32 token,
        uint256 networkFee,
        address to,
        uint256 amount
    ) public onlyManager returns (bool) {
        bytes32 proof = getProof(
            methodWord_transfer,
            token,
            networkFee,
            to,
            amount
        );
        address signer = preAuthValidations(proof, message, token, signature);
        IAUZToken(azx).delegateTransferFrom(signer, to, amount, msg.sender, networkFee, true);

        return true;
    }
}
