// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../access/IAccess.sol";

contract HotWallet is Initializable {
    uint256 public BUY_LIMIT;
    address public azx;
    address public accessControl;

    mapping(bytes32 => SaleRequest) public saleRequests; // mapping to track sale requests

    struct SaleRequest {
        bytes32 saleId;
        address seller;
        uint256 amount;
        bool isApproved;
        bool isProcessed;
    }

    event Buy(address indexed buyer, uint256 amount);
    event BuyWithSignature(
        address indexed buyer,
        address signer,
        address caller,
        uint256 amount
    );
    event TokenSold(
        string actionType,
        address signer,
        address manager,
        address to,
        uint256 amount,
        uint256 networkFee
    );
    event SaleRequestCreated(
        bytes32 saleId,
        address indexed seller,
        uint256 amount
    );
    event SaleRequestProcessed(address admin, bytes32 saleId, bool isApproved);

    modifier onlyOwner() {
        require(
            IAccess(accessControl).isOwner(msg.sender),
            "AUZToken: Only owner is allowed"
        );
        _;
    }

    modifier onlyManager() {
        require(
            IAccess(accessControl).isSender(msg.sender),
            "HotWallet: Only managers is allowed"
        );
        _;
    }

    function initialize(address _azx, address _access) external initializer {
        accessControl = _access;
        azx = _azx;
        BUY_LIMIT = 5000 * 10**8;
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
     * @notice Update limit for buy without second manager signature
     * @dev Only owner can call
     * @param _limit Limit for buy without second manager signature
     */
    function updateBuyLimit(uint256 _limit) external onlyOwner {
        BUY_LIMIT = _limit;
    }

    /**
     * @notice Withdraw from contract any token
     * @dev Only owner can call
     * @param _token Token address for withdrawing
     * @param _to Destination address
     * @param _amount Withdrawing amount
     */
    function withdraw(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(_to != address(0), "HotWallet: zero address is not allowed");
        IERC20(_token).transfer(_to, _amount);
    }

    /**
     * @notice Send AZX tokens from this contract to user with amount limit
     * @dev Only managers can call
     * @param _buyer The address of user
     * @param _amount Amount of AZX
     */
    function buy(address _buyer, uint256 _amount) external onlyManager {
        require(_amount <= BUY_LIMIT, "HotWallet: amount exceeds buy limit");
        require(_buyer != address(0), "HotWallet: zero address is not allowed");
        IERC20(azx).transfer(_buyer, _amount);

        emit Buy(_buyer, _amount);
    }

    /**
     * @notice Get proof for admin for buy with signature
     */
    function getBuyProof(
        bytes32 token,
        address buyer,
        uint256 amount
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, buyer, amount)
        );
    }

    /**
     * @notice Send AZX tokens from this contract to user without limit and with second manager signature
     * @dev Only managers can call
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @param buyer The fee that will be paid to relayer for gas fee he spends
     * @param amount The amount to be allowed
     */
    function buyWithSignature(
        bytes memory signature,
        bytes32 token,
        address buyer,
        uint256 amount
    ) external onlyManager {
        bytes32 message = getBuyProof(token, buyer, amount);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "HotWallet: Signer is not manager"
        );
        IERC20(azx).transfer(buyer, amount);

        emit BuyWithSignature(buyer, signer, msg.sender, amount);
    }

    /**
     * @notice Get proof for user for signing sale operations of its tokens
     */
    function getSaleProof(
        bytes32 token,
        address seller,
        uint256 amount,
        uint256 networkFee
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, seller, amount, networkFee)
        );
    }

    /**
     * @notice Delegated sell of AZX (takes tokens and creates request). Gas fee will be paid by relayer
     * @param signature Signature
     * @param token The unique token for each delegated function
     * @param networkFee The fee that will be paid to relayer for gas fee he spends
     * @param amount The array of amounts to be selled
     */
    function preAuthorizedSell(
        bytes memory signature,
        bytes32 token,
        address seller,
        uint256 amount,
        bytes32 saleId,
        uint256 networkFee
    ) public onlyManager returns (bool) {
        bytes32 message = getSaleProof(token, seller, amount, networkFee);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(seller == signer, "HotWallet: Signer is not seller");
        IERC20(azx).transferFrom(seller, msg.sender, networkFee);
        IERC20(azx).transferFrom(seller, address(this), amount);
        require(saleRequests[saleId].seller == address(0), "HotWallet: saleId already exists");
        saleRequests[saleId] = SaleRequest(
            saleId,
            signer,
            amount,
            false,
            false
        );
        emit SaleRequestCreated(saleId, seller, amount);

        return true;
    }

    /**
     * @notice Get proof for admin for process sale request
     */
    function getSaleProcessProof(
        bytes32 token,
        bytes32 saleId,
        bool isApproved
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, saleId, isApproved)
        );
    }

    /**
     * @notice Admins approving of sale request
     * @dev Signer of signature and trx sender must be different and both must be admins
     * @param saleId ID of the sale request
     * @param isApproved Admins decision about the request
     */
    function processSaleRequest(
        bytes memory signature,
        bytes32 token,
        bytes32 saleId,
        bool isApproved
    ) external onlyManager {
        bytes32 message = getSaleProcessProof(token, saleId, isApproved);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "HotWallet: Signer is not manager"
        );
        require(
            saleRequests[saleId].isProcessed == false,
            "HotWallet: Request is already processed"
        );
        require(
            saleRequests[saleId].seller != address(0),
            "HotWallet: Request is not exist"
        );
        if (!isApproved) {
            require(
                IERC20(azx).transfer(
                    saleRequests[saleId].seller,
                    saleRequests[saleId].amount
                ),
                "HotWallet: Transfer error"
            );
        }
        saleRequests[saleId].isProcessed = true;
        saleRequests[saleId].isApproved = isApproved;
        emit SaleRequestProcessed(signer, saleId, isApproved);
    }
}
