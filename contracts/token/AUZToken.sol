// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/**
 * @title AUZToken
 * @author Idealogic
 * @notice Contract for the AUZToken
 * @dev All function calls are currently implemented without side effects
 */
contract AUZToken is
    Initializable,
    OwnableUpgradeable,
    ERC20Upgradeable,
    PausableUpgradeable
{
    // attach library functions
    using AddressUpgradeable for address;

    // event
    event CommissionUpdate(uint256 _percent, string _data);
    event DelegateTransfer(address _caller, address _sender, address _recipient, uint256 _amount);
     

    uint256 public mintingProofsCounter;
    uint256 public burningProofsCounter;
    uint8 private decimal;

    // These variable help to calculate the commissions on each token transfer transcation
    uint256 public MINT_FEE_PERCENT; // commission percentage on minting
    uint256 public TRANSFER_FEE_PERCENT; // commission percentage on transfer
    uint256 public PERCENT_COEFICIENT; // denominator for percentage calculation

    // Minter address
    address public minter;

    // Address at which fees transferred
    address public feeWallet;

    // Tokens minted in this wallet
    address public sellingWallet;

    // Contract wich uses for delegate operations
    address public transfersDelegator;

    //Proofs for gold mints
    mapping(uint256 => string) public mintingProofs;

    //Proofs for gold burns
    mapping(uint256 => string) public burningProofs;

    //Mapping of addresses of contracts that are allowed to transfer tokens
    mapping(address => bool) public allowedContracts;

    //Mapping of addresses of contracts that are free of transfer fee
    mapping(address => bool) public freeOfFeeContracts;

    function initialize(
        address _sellingWallet,
        address _minter,
        address _feeWallet
    ) external initializer {
        __ERC20_init("AUZToken", "AUZ");
        __Ownable_init();
        __Pausable_init();
        feeWallet = _feeWallet;
        sellingWallet = _sellingWallet;
        minter = _minter;

        decimal = 8;
        MINT_FEE_PERCENT = 0; // 0.000%
        TRANSFER_FEE_PERCENT = 1; // 0.001%
        PERCENT_COEFICIENT = 100000; // 100000 = 100%, minimum value is 0.001%.
    }

    ////////////////////////////////////////////////////////////////
    //                 modifiers
    ////////////////////////////////////////////////////////////////
    modifier onlyMinter() {
        require(
            msg.sender == minter || msg.sender == owner(),
            "AUZToken: Only Minter is allowed"
        );
        _;
    }

    modifier onlyAllowedContracts() {
        require(
            (address(msg.sender).isContract() &&
                allowedContracts[msg.sender]) ||
                !address(msg.sender).isContract(),
            "AUZToken: Contract doesn't have permission to transfer tokens"
        );
        _;
    }

    ////////////////////////////////////////////////////////////////
    //                  Only Owner functions
    ////////////////////////////////////////////////////////////////

    /**
     * @notice Pause all operations with AUZ
     * @dev Only owner can call
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unause all operations with AUZ
     * @dev Only owner can call
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update address of minter
     * @dev Only owner can call
     * @param _minter The minter address
     */
    function updateMinter(address _minter) public onlyOwner {
        require(_minter != address(0), "Zero address is not allowed");
        minter = _minter;
    }

    /**
     * @notice Update address which uses for delegate operations
     * @dev Only owner can call
     * @param _transfersDelegator The fee address
     */
    function updateTransfersDelegator(address _transfersDelegator)
        public
        onlyOwner
    {
        require(
            _transfersDelegator != address(0),
            "Zero address is not allowed"
        );
        transfersDelegator = _transfersDelegator;
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
     * @notice Update address at which tokens are sold
     * @dev Only owner can call
     * @param _sellingWallet The selling address
     */
    function updateSellingWallet(address _sellingWallet) public onlyOwner {
        require(_sellingWallet != address(0), "Zero address is not allowed");
        sellingWallet = _sellingWallet;
    }

    /**
     * @notice Update addresses of contracts that are allowed to transfer tokens
     * @dev Only owner can call
     * @param _contractAddress The address of the contract
     * @param _isAllowed Bool variable that indicates is contract allowed to transfer tokens
     */
    function updateAllowedContracts(address _contractAddress, bool _isAllowed)
        external
        onlyOwner
    {
        allowedContracts[_contractAddress] = _isAllowed;
    }

    /**
     * @notice  Update addresses of contracts that are free of transfer fee
     * @dev Only owner can call
     * @param _contractAddress The address of the contract
     * @param _isFree Bool variable that indicates is contract free of transfer fee
     */
    function updateFreeOfFeeContracts(address _contractAddress, bool _isFree)
        external
        onlyOwner
    {
        freeOfFeeContracts[_contractAddress] = _isFree;
    }

    /**
     * @notice Update commission to be charged on token minting
     * @dev Only owner can call
     * @param _mintFeePercent The comission percent
     */
    function updateCommissionMint(uint256 _mintFeePercent) public onlyOwner {
        require(
            _mintFeePercent <= PERCENT_COEFICIENT,
            "Commission cannot be more than 100%"
        );
        MINT_FEE_PERCENT = _mintFeePercent;
        emit CommissionUpdate(MINT_FEE_PERCENT, "Minting commision");
    }

    /**
     * @notice Update commission to be charged on token transfer
     * @dev Only owner can call
     * @param _transferFeePercent The comission percent
     */
    function updateCommissionTransfer(uint256 _transferFeePercent)
        public
        onlyOwner
    {
        require(
            _transferFeePercent <= PERCENT_COEFICIENT,
            "Commission cannot be more than 100%"
        );
        TRANSFER_FEE_PERCENT = _transferFeePercent;
        emit CommissionUpdate(TRANSFER_FEE_PERCENT, "Transfer commision");
    }

    /**
     * @notice transfer tokens from contract
     * @dev Only owner can call, tokens will be transferred and equivalent amount of ZToken will be burnt.
     * @param _amount the amount of tokens to be transferred
     * @param _hashes The array of IPFS hashes of the gold burn proofs
     */
    function burnGold(uint256 _amount, string[] memory _hashes)
        external
        onlyMinter
        whenNotPaused
    {
        for (uint256 i = 0; i < _hashes.length; i++) {
            burningProofs[burningProofsCounter] = _hashes[i];
            burningProofsCounter++;
        }
        _burn(address(this), _amount);
    }

    /**
     * @notice Minting of AUZtokens backed by gold tokens
     * @param _value The amount transferred
     * @param _hashes The array of IPFS hashes of the gold mint proofs
     */
    function mintGold(uint256 _value, string[] memory _hashes)
        public
        onlyMinter
        whenNotPaused
    {
        uint256 fee = calculateCommissionMint(_value);
        if (fee > 0) _mint(feeWallet, fee);
        for (uint256 i = 0; i < _hashes.length; i++) {
            mintingProofs[mintingProofsCounter] = _hashes[i];
            mintingProofsCounter++;
        }
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
        whenNotPaused
        onlyAllowedContracts
        returns (bool)
    {
        _privateTransfer(msg.sender, recipient, amount, true);
        return true;
    }

    /**
     * @notice Standard transferFrom. Send tokens on behalf of spender
     * @dev overriden Function of the openzeppelin ERC20 contract
     * @param recipient receiver's address
     * @param sender transfer token from account
     * @param amount The amount to be transferred
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    )
        public
        virtual
        override
        whenNotPaused
        onlyAllowedContracts
        returns (bool)
    {
        uint256 currentAllowance = allowance(sender, _msgSender());
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        _approve(sender, _msgSender(), currentAllowance - amount);
        _privateTransfer(sender, recipient, amount, true);
        return true;
    }

    /**
     * @notice Delegate approve for transfersDelegator contract only.
     * @dev overriden Function of the openzeppelin ERC20 contract
     * @param owner receiver's address
     * @param amount The amount to be transferred
     */
    function delegateApprove(
        address owner,
        uint256 amount,
        address broadcaster,
        uint256 networkFee
    )
        external
        whenNotPaused
        returns (bool)
    {
        require(
            transfersDelegator == _msgSender(),
            "Only transfers delegator can call this function"
        );
        _privateTransfer(owner, broadcaster, networkFee, false);
        _approve(owner, transfersDelegator, amount);
        return true;
    }

    /**
     * @notice Delegate transferFrom for transfersDelegator contract only.
     * @dev overriden Function of the openzeppelin ERC20 contract
     * @param recipient receiver's address
     * @param sender transfer token from account
     * @param amount The amount to be transferred
     */
    function delegateTransferFrom(
        address sender,
        address recipient,
        uint256 amount,
        address broadcaster,
        uint256 networkFee,
        bool feeMode
    )
        external
        whenNotPaused
        returns (bool)
    {
        require(
            transfersDelegator == msg.sender,
            "Only transfers delegator can call this function"
        );
        uint256 currentAllowance = allowance(sender,transfersDelegator);
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        _approve(sender, _msgSender(), currentAllowance - amount);
        _privateTransfer(sender, broadcaster, networkFee, false);
        _privateTransfer(sender, recipient, amount, feeMode);
        emit DelegateTransfer(tx.origin, sender, recipient, amount);
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
    function _privateTransfer(
        address _from,
        address _recipient,
        uint256 _amount,
        bool _feeMode
    ) internal returns (bool) {
        require(
            _recipient != address(0),
            "ERC20: transfer to the zero address"
        );
        uint256 fee = calculateCommissionTransfer(_amount);
        if (fee > 0 && !freeOfFeeContracts[_from] && _feeMode)
            _transfer(_from, feeWallet, fee);
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
        return (_amount * MINT_FEE_PERCENT) / PERCENT_COEFICIENT;
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
        return (_amount * TRANSFER_FEE_PERCENT) / PERCENT_COEFICIENT;
    }

    /**
     * @notice Prevents contract from accepting ETHs
     * @dev Contracts can still be sent ETH with self destruct. If anyone deliberately does that, the ETHs will be lost
     */
    receive() external payable {
        revert("Contract does not accept ethers");
    }
}
