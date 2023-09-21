pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./IAccess.sol";

contract Access is Initializable, OwnableUpgradeable, IAccess {
    mapping(address => bool) public signValidationWhitelist; //Mapping of sddresses of contracts who can use preAuthValidations
    mapping(address => mapping(bytes32 => bool)) public tokenUsed; //Mapping to track token is used or not
    mapping(address => bool) public minters; // Mapping of azx minters
    mapping(address => bool) public sendManagers; // Mapping of addresses who can send delegate trxs
    mapping(address => bool) public signManagers; // Mapping of addresses who can sign internal operations
    mapping(address => bool) public tradeDeskManagers; // Mapping of addresses of TradeDesk users

    event SignatureValidated(address indexed signer, bytes32 token);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    receive() external payable {
        revert("Accsess: Contract cannot work with ETH");
    }

    /**
     * @dev Initializes the contract
     */
    function initialize() public initializer {
        __Ownable_init();
        minters[msg.sender] = true;
        sendManagers[msg.sender] = true;
        signManagers[msg.sender] = true;
        tradeDeskManagers[msg.sender] = true;
    }

    /**
     * @notice Update managers roles for addresses
     * @dev Only owner can call
     * @param _manager The wallet of the user
     * @param _isManager Bool variable that indicates is wallet is manager or not
     */
    function updateMinters(
        address _manager,
        bool _isManager
    ) external onlyOwner {
        require(_manager != address(0), "Access: Zero address is not allowed");
        minters[_manager] = _isManager;
    }

    /**
     * @notice Update addressess who can send delegate trxs
     * @dev Only owner can call
     * @param _manager The wallet of the user
     * @param _isManager Bool variable that indicates is wallet is manager or not
     */
    function updateSenders(
        address _manager,
        bool _isManager
    ) external onlyOwner {
        require(_manager != address(0), "Access: Zero address is not allowed");
        sendManagers[_manager] = _isManager;
    }

    /**
     * @notice Update addressess who can sign delegate operations
     * @dev Only owner can call
     * @param _manager The wallet of the user
     * @param _isManager Bool variable that indicates is wallet is manager or not
     */
    function updateSigners(
        address _manager,
        bool _isManager
    ) external onlyOwner {
        require(_manager != address(0), "Access: Zero address is not allowed");
        signManagers[_manager] = _isManager;
    }

    /**
     * @notice Update addressess of TradeDesk users
     * @dev Only owner can call
     * @param _user The wallet of the user
     * @param _isTradeDesk Bool variable that indicates is wallet is TradeDesk or not
     */
    function updateTradeDeskUsers(
        address _user,
        bool _isTradeDesk
    ) external override {
        require(
            msg.sender == owner() || signValidationWhitelist[msg.sender],
            "Access: Only owner or sign manager can call"
        );
        require(_user != address(0), "Access: Zero address is not allowed");
        tradeDeskManagers[_user] = _isTradeDesk;
    }

    /**
     * @notice Update whitelist of addresses of contracts who can use preAuthValidations
     * @dev Only owner can call
     * @param _contract The address of the contract
     * @param _canValidate Bool variable that indicates is address can use preAuthValidations
     */
    function updateSignValidationWhitelist(
        address _contract,
        bool _canValidate
    ) external onlyOwner {
        require(_contract != address(0), "Access: Zero address is not allowed");
        signValidationWhitelist[_contract] = _canValidate;
    }

    /**
     * @notice Validates the message and signature
     * @param message The message that user signed
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @return address Signer of message
     */
    function preAuthValidations(
        bytes32 message,
        bytes32 token,
        bytes memory signature
    ) external override returns (address) {
        require(
            signValidationWhitelist[msg.sender],
            "Access: Sender is not whitelisted to use preAuthValidations"
        );
        address signer = getSigner(message, signature);
        require(signer != address(0), "Access: Zero address not allowed");
        require(!tokenUsed[signer][token], "Access: Token already used");
        tokenUsed[signer][token] = true;

        emit SignatureValidated(signer, token);
        return signer;
    }

    /**
     * @notice Check if address is owner
     */
    function isOwner(address _manager) external view override returns (bool) {
        return _manager == owner();
    }

    /**
     * @notice Check if address is minter
     */
    function isMinter(address _manager) external view override returns (bool) {
        return minters[_manager];
    }

    /**
     * @notice Check if address is sender
     */
    function isSender(address _manager) external view override returns (bool) {
        return sendManagers[_manager];
    }

    /**
     * @notice Check if address is signer
     */
    function isSigner(address _manager) external view override returns (bool) {
        return signManagers[_manager];
    }

    /**
     * @notice Check if address is TradeDesk user
     */
    function isTradeDesk(address _user) external view override returns (bool) {
        return tradeDeskManagers[_user];
    }

    /**
     * @notice Find signer
     * @param message The message that user signed
     * @param signature Signature
     * @return address Signer of message
     */
    function getSigner(
        bytes32 message,
        bytes memory signature
    ) public pure returns (address) {
        message = ECDSA.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(message, signature);
        return signer;
    }
}
