// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../token/iazx.sol";

/**
 * @title AUZToken
 * @author Idealogic
 * @notice Contract for the AUZToken
 * @dev All function calls are currently implemented without side effects
 */
contract HotWallet is Ownable {
    uint256 signatureToken;
    uint256 public BUY_LIMIT = 5000 * 1e8;
    address public azx;

    mapping(address => bool) public managers;

    modifier onlyManager() {
        require(managers[msg.sender], "HotWallet: caller is not the manager");
        _;
    }

    constructor(address _azxToken) {
        azx = _azxToken;
        managers[msg.sender] = true;
    }

    function updateManagers(address _address, bool isManager)
        external
        onlyOwner
    {
        managers[_address] = isManager;
    }

    function updateBuyLimit(uint256 _limit) external onlyOwner {
        BUY_LIMIT = _limit;
    }

    function buyGold(address buyer, uint256 amount) external onlyManager {
        require(amount <= BUY_LIMIT, "HotWallet: amount exceeds buy limit");
        require(buyer != address(0), "HotWallet: zero address is not allowed");
        ERC20(azx).transfer(buyer, amount);
    }

    function buyGoldWithSignature(
        address buyer,
        uint256 amount,
        bytes32 message,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) external onlyManager {
        bytes32 proof = getSignatureProof(buyer, amount);
        address signer = preAuthValidations(proof, message, r, s, v);
        require(managers[signer], "HotWallet: Signer is not manager");
        require(
            signer != msg.sender,
            "HotWallet: Signer must be another manager"
        );
        ERC20(azx).transfer(buyer, amount);
    }

    function sellGoldWithSignature(
        address seller,
        uint256 amount,
        bytes32 message,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) external onlyManager {
        bytes32 proof = getSignatureProof(seller, amount);
        address signer = preAuthValidations(proof, message, r, s, v);
        require(signer == seller, "HotWallet: Signer is not investor");
        IAdvancedAUZToken(azx).sellGoldWithHotWallet(seller,amount);
    }

    function getSignatureProof(address investor, uint256 amount)
        public
        view
        returns (bytes32)
    {
        bytes32 proof = keccak256(
            abi.encodePacked(getChainID(), investor, amount, signatureToken)
        );
        return proof;
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
     * @notice Validates the message and signature
     * @param proof The message that was expected to be signed by user
     * @param message The message that user signed
     * @param r Signature component
     * @param s Signature component
     * @param v Signature component
     * @return address Signer of message
     */
    function preAuthValidations(
        bytes32 proof,
        bytes32 message,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) internal pure returns (address) {
        address signer = getSigner(message, r, s, v);
        require(signer != address(0), "Zero address not allowed");
        require(proof == message, "Invalid proof");
        return signer;
    }

    /**
     * @notice Find signer
     * @param message The message that user signed
     * @param r Signature component
     * @param s Signature component
     * @param v Signature component
     * @return address Signer of message
     */
    function getSigner(
        bytes32 message,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) internal pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, message));
        address signer = ecrecover(prefixedHash, v, r, s);
        return signer;
    }

    function withdraw(address _token, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "HotWallet: zero address is not allowed");
        ERC20(_token).transfer(_to, _amount);
    }
}
