// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title AUZToken
 * @author Idealogic
 * @notice Contract for the AUZToken
 * @dev All function calls are currently implemented without side effects
 */
contract AUZToken is Ownable, ERC20 {
    // attach library functions
    using SafeERC20 for IERC20;
    using Address for address;

    //event
    event CommissionUpdate(
        uint256 _percent,
        string _data
    );
    event TransferPreSigned(address _from, address _to, uint256 _value, uint256 _networkFee);

    //public variables
    IERC20 private backedTokenContract;

    //private variables
    uint8 private decimal = 8;
    bool private migrated;
    bool private paused;

    // These variable help to calculate the commissions on each token transfer transcation
    uint256 public MINT_FEE_PERCENT = 25; // commission percentage on minting 0.025%
    uint256 public TRANSFER_FEE_PERCENT = 1; // commission percentage on transfer 0.001%
    uint256 public PERCENT_COEFICIENT = 100000; // denominator for percentage calculation. 100000 = 100%, minimum value is 0.001%. 

    // Minter address
    address public minter;

    // Address at which fees transferred
    address public feeWallet;

    // Tokens minted in this wallet
    address public sellingWallet;

    constructor(
        address _goldTokenAddress,
        address _sellingWallet,
        address _minter,
        address _feeWallet
    )
        isContractAddress(_goldTokenAddress)
        onlyNonZeroAddress(_sellingWallet)
        ERC20("AUZToken", "AUZ")
    {
        backedTokenContract = IERC20(_goldTokenAddress);
        sellingWallet = _sellingWallet;
        minter = _minter;
        feeWallet = _feeWallet;
        migrated = false;
        paused = false;
    }

    ////////////////////////////////////////////////////////////////
    //                 modifiers
    ////////////////////////////////////////////////////////////////

    modifier onlyNonZeroAddress(address _user) {
        require(_user != address(0), "Zero address not allowed");
        _;
    }

    modifier onlyTokenContract() {
        require(
            msg.sender == address(backedTokenContract),
            "Only Token contract is allowed"
        );
        _;
    }

    modifier isContractAddress(address _addressContract) {
        require(
            _addressContract.isContract(),
            "Only contract is allowed"
        );
        _;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "Only Minter is allowed");
        _;
    }

    modifier isNotOPaused {
        require(paused == false, "Operations paused");
        _;
    }

    ////////////////////////////////////////////////////////////////
    //                  Only Owner functions
    ////////////////////////////////////////////////////////////////

    /**
     * @notice transfer tokens from contract
     * @dev Only owner can call, tokens will be transferred and equivalent amount of ZToken will be burnt.
     * @param _amount the amount of tokens to be transferred
     * @param _receiver address of the receiver

     */
    function transferToken(uint256 _amount, address _receiver)
        external
        onlyOwner
        onlyNonZeroAddress(_receiver)
        isNotOPaused
    {
        require(
            backedTokenContract.balanceOf(address(this)) >= _amount,
            "Insufficient balance of token"
        );
        backedTokenContract.transfer(_receiver, _amount);
        _burn(msg.sender, _amount);
    }

    /**
     * @notice Minting of Ztokens backed by gold tokens
     * @param _value The amount transferred
     */
    function mintGold(uint256 _value
    ) public
    onlyMinter
    isNotOPaused
    {
        uint256 balanceBefore = backedTokenContract.balanceOf(address(this));
        require(backedTokenContract.transferFrom(msg.sender, address(this), _value), "Transfer failed");
        uint256 balanceAfter = backedTokenContract.balanceOf(address(this));
        require(balanceAfter - balanceBefore == _value, "Minting failed");
        uint256 fee = calculateCommissionMint(_value);
        if (fee > 0) _mint(feeWallet, fee);
        _mint(sellingWallet, _value - fee);
    }

    ////////////////////////////////////////////////////////////////
    //                  overriden functions
    ////////////////////////////////////////////////////////////////
    function decimals() public view virtual override returns (uint8) {
        return decimal;
    }


    /**
     * @notice Standard transfer function to Transfer token
     * @dev overriden Function of the openzeppelin ERC20 contract
     * @param recipient receiver's address
     * @param amount The amount to be transferred
     */
    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        isNotOPaused
        returns (bool)
    {
        privateTransfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @notice Standard transferFrom. Send tokens on behalf of spender
     * @dev overriden Function of the openzeppelin ERC20 contract
     * @param recipient receiver's address
     * @param sender transfer token from account
     * @param amount The amount to be transferred
     */
    function transferFrom(address sender, address recipient, uint256 amount)
        public
        virtual
        override
        isNotOPaused
        returns (bool)
    {
        uint256 currentAllowance = allowance(sender, _msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, _msgSender(), currentAllowance - amount);
        privateTransfer(sender, recipient, amount);
        return true;
    }

    /**
     * @notice Backed token contract migration function
     * @dev Replaces old tokens by the new one, can be called only once,
     * old tokens receiver is the contract owner, new tokens supplier is the contract owner
     * @param _newGoldAddress New backed contract address
     */
    function migrateGoldToken(address _newGoldAddress) public
    onlyOwner
    isContractAddress(_newGoldAddress)
    onlyNonZeroAddress(_newGoldAddress)
    returns(bool) {
        require(migrated == false, "Token already migrated");
        require(_newGoldAddress != address(backedTokenContract), "Same address is not allowed");
        uint256 balance = backedTokenContract.balanceOf(address(this));
        backedTokenContract.transfer(owner(), balance);
        backedTokenContract = IERC20(_newGoldAddress);
        backedTokenContract.transferFrom(owner(), address(this), balance);
        require(balance == backedTokenContract.balanceOf(address(this)), "Migration: operation error");
        migrated = true;
        paused = false;
        return true;
    }

    /**
    * @notice Private method to pause or unpause token operations
    * @param _value Bool variable that indicates the contract state
    */
    function pauseTransfers(bool _value) public onlyOwner returns(bool) {
        paused = _value;
        return true;
    }


    /**
     * @notice Internal method to handle transfer logic
     * @dev Notifies recipient, if recipient is a trusted contract
     * @param _from Sender address
     * @param _recipient Recipient address
     * @param _amount amount of tokens to be transferred
     * @return bool
     */
    function privateTransfer(address _from, address _recipient, uint256 _amount)
        internal
        onlyNonZeroAddress(_recipient)
        returns (bool)
    {
        uint256 fee = calculateCommissionTransfer(_amount);

        if (fee > 0) _transfer(_from, feeWallet, fee);
        _transfer(_from, _recipient, _amount - fee);
        return true;
    }


    /**
     * @notice check Minting fee
     * @dev Does not checks if sender/recipient is whitelisted
     * @param _amount The intended amount of transfer
     * @return uint256 Calculated commission
     */
    function calculateCommissionMint(uint256 _amount)
        public
        view
        returns (uint256)
    {
        return _amount * MINT_FEE_PERCENT / PERCENT_COEFICIENT;
    }

    /**
     * @notice check Transfer fee
     * @dev Does not checks if sender/recipient is whitelisted
     * @param _amount The intended amount of transfer
     * @return uint256 Calculated commission
     */
    function calculateCommissionTransfer(uint256 _amount)
        public
        view
        returns (uint256)
    {
        return _amount * TRANSFER_FEE_PERCENT / PERCENT_COEFICIENT;
    }

    /**
     * @notice Update commission to be charged on token minting
     * @dev Only owner can call
     * @param _mintFeePercent The comission percent
     */
    function updateCommissionMint(uint256 _mintFeePercent) public onlyOwner {
        require(_mintFeePercent <= PERCENT_COEFICIENT, "Commission cannot be more than 100%");
        MINT_FEE_PERCENT = _mintFeePercent;
        emit CommissionUpdate(MINT_FEE_PERCENT, "Minting commision");
    }

    /**
     * @notice Update commission to be charged on token transfer
     * @dev Only owner can call
     * @param _transferFeePercent The comission percent
     */
    function updateCommissionTransfer(uint256 _transferFeePercent) public onlyOwner {
        require(_transferFeePercent <= PERCENT_COEFICIENT, "Commission cannot be more than 100%");
        TRANSFER_FEE_PERCENT = _transferFeePercent;
        emit CommissionUpdate(TRANSFER_FEE_PERCENT, "Transfer commision");
    }

    /**
     * @notice Update address at which fees transferred
     * @dev Only owner can call
     * @param _feeWallet The fee address
     */
    function updateFeeWallet(address _feeWallet) public onlyOwner {
        require(_feeWallet != address(0), "Zero address is not allowed");
        feeWallet = _feeWallet;
    }


    /**
     * @notice Prevents contract from accepting ETHs
     * @dev Contracts can still be sent ETH with self destruct. If anyone deliberately does that, the ETHs will be lost
     */
    receive() external payable {
        revert("Contract does not accept ethers");
    }


}

/**
 * @title AdvancedOToken
 * @author Phoenix
 */
contract AdvancedAUZToken is AUZToken {
    mapping(address => mapping(bytes32 => bool)) public tokenUsed; // mapping to track token is used or not

    bytes4 public methodWord_transfer = bytes4(keccak256("transfer(address,uint256)"));
    bytes4 public methodWord_approve = bytes4(keccak256("approve(address,uint256)"));
    bytes4 public methodWord_increaseApproval = bytes4(keccak256("increaseAllowance(address,uint256)"));
    bytes4 public methodWord_decreaseApproval = bytes4(keccak256("decreaseAllowance(address,uint256)"));

    constructor(
        address _goldTokenAddress,
        address _sellingWallet,
        address _minter,
        address _feeWallet
    )  AUZToken( _goldTokenAddress, _sellingWallet, _minter, _feeWallet) {
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
     * @param token The unique token for each delegated function
     * @return address Signer of message
     */
    function preAuthValidations(bytes32 proof, bytes32 message, bytes32 token, bytes32 r, bytes32 s, uint8 v)
        private
        returns(address)
    {
        address signer = getSigner(message, r, s, v);
        require(signer != address(0),"Zero address not allowed");
        require(!tokenUsed[signer][token],"Token already used");
        require(proof == message, "Invalid proof");
        tokenUsed[signer][token] = true;
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
    function getSigner(bytes32 message, bytes32 r, bytes32 s, uint8 v)
        public
        pure
        returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, message));
        address signer = ecrecover(prefixedHash, v, r, s);
        return signer;
    }

     /**
     * @notice Delegated transfer. Gas fee will be paid by relayer
     * @param message The message that user signed
     * @param r Signature component
     * @param s Signature component
     * @param v Signature component
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param to The array of recipients
     * @param amount The array of amounts to be transferred
     */
    function preAuthorizedTransfer(
        bytes32 message, bytes32 r, bytes32 s, uint8 v, bytes32 token, uint256 networkFee, address to, uint256 amount)
        public
    {
        bytes32 proof = getProofTransfer(methodWord_transfer, token, networkFee, msg.sender, to, amount);
        address signer = preAuthValidations(proof, message, token, r, s, v);

        // Deduct network fee if broadcaster charges network fee
        if (networkFee > 0) {
            privateTransfer(signer, msg.sender, networkFee);
        }
        privateTransfer(signer, to, amount);
        emit TransferPreSigned(signer, to, amount, networkFee);
    }

    /**
     * @notice Delegated approval. Gas fee will be paid by relayer
     * @dev Only approve, increaseApproval and decreaseApproval can be delegated
     * @param message The message that user signed
     * @param r Signature component
     * @param s Signature component
     * @param v Signature component
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param to The spender address
     * @param amount The amount to be allowed
     * @return Bool value
     */
    function preAuthorizedApproval(
        bytes4 methodHash, bytes32 message, bytes32 r, bytes32 s, uint8 v, bytes32 token, uint256 networkFee, address to, uint256 amount)
        public
        returns (bool)
    {
        bytes32 proof = getProofApproval (methodHash, token, networkFee, msg.sender, to, amount);
        address signer = preAuthValidations(proof, message, token, r, s, v);
        uint256 currentAllowance = allowance(signer, _msgSender());
        // Perform approval
        if(methodHash == methodWord_approve) _approve(signer, to, amount);
        else if(methodHash == methodWord_increaseApproval) _approve(signer, to, currentAllowance + amount);
        else if(methodHash == methodWord_decreaseApproval) _approve(signer, to, currentAllowance - amount);
        return true;
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
    function getProofTransfer(bytes4 methodHash, bytes32 token, uint256 networkFee, address broadcaster, address to, uint256 amount)
        public
        view
        returns (bytes32)
    {
        require(methodHash == methodWord_transfer, "Method not supported");
        bytes32 proof = keccak256(abi.encodePacked(
            getChainID(),
            bytes4(methodHash),
            address(this),
            token,
            networkFee,
            broadcaster,
            to,
            amount
    ));
        return proof;
    }

    /**
     * @notice Get the message to be signed in case of delegated transfer/approvals
     * @param methodHash The method hash for which delegate action in to be performed
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param to The recipient or spender
     * @param amount The amount to be approved
     * @return Bool value
     */
    function getProofApproval(bytes4 methodHash, bytes32 token, uint256 networkFee, address broadcaster, address to, uint256 amount)
        public
        view
        returns (bytes32)
    {
        require(
            methodHash == methodWord_approve ||
            methodHash == methodWord_increaseApproval ||
            methodHash == methodWord_decreaseApproval,
            "Method not supported");
        bytes32 proof = keccak256(abi.encodePacked(
            getChainID(),
            bytes4(methodHash),
            address(this),
            token,
            networkFee,
            broadcaster,
            to,
            amount
        ));
        return proof;
    }

}
