pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../lib/TransferHelper.sol";
import "../access/IAccess.sol";

contract Escrow is Initializable {
    // The time elapsed since the registration of the trade, after which the administrator will be able to resolve the trade
    uint256 public PERIOD_FOR_RESOLVE;
    // The counter of trades
    uint256 public tradesCounter;
    // Address of AZK token
    address public azx;
    // Address of wallet for receiving fees
    address public auzWallet;
    // Address of access control contract
    address public accessControl;

    // Mapping of trades
    mapping(uint256 => Trade) public trades;
    // Mapping of trade's external ids to internal ids
    mapping(string => uint256) public tradesIdsToTrades;

    // The struct of trade
    struct Trade {
        string tradeId;
        bytes tradeHash;
        address seller;
        address buyer;
        uint256 price;
        uint256 fee;
        uint256 timestamp;
        bool paid;
        bool approved;
        bool finished;
    }

    // Events
    event TradeRegistered(
        address signer,
        string indexed tradeId,
        bytes tradeHash,
        address seller,
        address buyer,
        uint256 price,
        uint256 fee
    );
    event TradePaid(string tradeId, uint256 amount);
    event TradeApproved(string tradeId);
    event TradeFinished(address signer, string tradeId);
    event TradeResolved(address signer, string tradeId, bool result, string reason);

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

    receive() external payable {
        revert("Escrow: Contract cannot work with ETH");
    }

    /**
     * @dev Initializes the contract
     * @param _auzToken Address of AZK token
     * @param _auzWallet Address of wallet for receiving fees
     */
    function initialize(
        address _auzToken,
        address _auzWallet,
        address _access
    ) public initializer {
        accessControl = _access;
        azx = _auzToken;
        auzWallet = _auzWallet;
        PERIOD_FOR_RESOLVE = 259200;
    }

    /**
     * @dev Changes address of wallet for receiving fees (for owner only)
     * @param _wallet Address of wallet for receiving fees
     */
    function changeWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Escrow: Zero address is not allowed");
        auzWallet = _wallet;
    }

    /**
     * @dev Changes period for resolving the trade (for owner only)
     * @param _period Address of wallet for receiving fees
     */
    function changePeriodForResolving(uint256 _period) external onlyOwner {
        PERIOD_FOR_RESOLVE = _period;
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
     * @dev Get message hash for signing for registerTrade
     */
    function registerProof(
        bytes32 _token,
        string memory _tradeId,
        bytes memory _tradeHash,
        address _seller,
        address _buyer,
        uint256 _price,
        uint256 _fee
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(
                getChainID(),
                _token,
                _tradeId,
                _tradeHash,
                _seller,
                _buyer,
                _price,
                _fee
            )
        );
    }

    /**
     * @dev Registers new trade (only for admin)
     * @param _tradeId External trade id
     * @param _tradeHash Hash of trade data
     * @param _seller Address of seller
     * @param _buyer Address of buyer
     * @param _price Price of trade
     * @param _fee Fee of trade
     */
    function registerTrade(
        bytes memory signature,
        bytes32 _token,
        string memory _tradeId,
        bytes memory _tradeHash,
        address _seller,
        address _buyer,
        uint256 _price,
        uint256 _fee
    ) external onlyManager {
        require(
            tradesIdsToTrades[_tradeId] == 0,
            "Escrow: Trade is already exist"
        );
        bytes32 message = registerProof(
            _token,
            _tradeId,
            _tradeHash,
            _seller,
            _buyer,
            _price,
            _fee
        );
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            _token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "HotWallet: Signer is not manager"
        );
        tradesCounter++;
        tradesIdsToTrades[_tradeId] = tradesCounter;
        Trade storage trade = trades[tradesCounter];
        trade.tradeId = _tradeId;
        trade.tradeHash = _tradeHash;
        trade.seller = _seller;
        trade.buyer = _buyer;
        trade.price = _price;
        trade.fee = _fee;
        trade.timestamp = block.timestamp;

        emit TradeRegistered(
            signer,
            _tradeId,
            _tradeHash,
            _seller,
            _buyer,
            _price,
            _fee
        );
    }

    /**
     * @dev Get message hash for signing for payTrade
     */
    function payProof(
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, _tradeId, _buyer)
        );
    }

    /**
     * @dev Pays for trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function payTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.buyer != address(0), "Escrow: Buyer is not confirmed");
        bytes32 message = payProof(token, _tradeId, _buyer);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            trade.buyer == signer && trade.buyer == _buyer,
            "Escrow: Signer is not a buyer"
        );
        TransferHelper.safeTransferFrom(
            azx,
            _buyer,
            address(this),
            trade.price + trade.fee
        );
        trade.paid = true;

        emit TradePaid(_tradeId, trade.price + trade.fee);
    }

    /**
     * @dev Get message hash for signing for approveTrade
     */
    function approveProof(
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, _buyer, _tradeId)
        );
    }

    /**
     * @dev Approves trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function approveTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        bytes32 message = approveProof(token, _tradeId, _buyer);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            trade.buyer == signer && trade.buyer == _buyer,
            "Escrow: Signer is not a buyer"
        );

        require(trade.paid, "Escrow: Trade is not paid");
        trade.approved = true;

        emit TradeApproved(_tradeId);
    }

    /**
     * @dev Get message hash for signing for finishTrade
     */
    function finishProof(bytes32 token, string memory _tradeId)
        public
        view
        returns (bytes32 message)
    {
        message = keccak256(abi.encodePacked(getChainID(), token, _tradeId));
    }

    /**
     * @dev Finishes trade (only for admin)
     * @param _tradeId External trade id
     */
    function finishTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId
    ) external onlyManager {
        bytes32 message = finishProof(token, _tradeId);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "Escrow: Signer is not manager"
        );
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.approved, "Escrow: Trade is not approved");
        TransferHelper.safeTransfer(azx, trade.seller, trade.price);
        TransferHelper.safeTransfer(azx, auzWallet, trade.fee);
        trade.finished = true;

        emit TradeFinished(signer, _tradeId);
    }

    /**
     * @dev Get message hash for signing for resolveTrade
     */
    function resolveProof(
        bytes32 token,
        string memory _tradeId,
        bool _result,
        string memory _reason
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, _tradeId, _result, _reason)
        );
    }

    /**
     * @dev Resolves trade (only for admin). Uses for resolving disputes.
     * @param _tradeId External trade id
     * @param _result Result of trade
     * @param _reason Reason of trade
     */
    function resolveTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        bool _result,
        string memory _reason
    ) external {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(
            block.timestamp >= trade.timestamp + PERIOD_FOR_RESOLVE,
            "Escrow: To early to resolve"
        );

        bytes32 message = resolveProof(token, _tradeId, _result, _reason);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "Escrow: Signer is not manager"
        );

        if (trade.paid) {
            if (_result) {
                TransferHelper.safeTransfer(azx, trade.seller, trade.price);
                TransferHelper.safeTransfer(azx, auzWallet, trade.fee);
            } else {
                TransferHelper.safeTransfer(
                    azx,
                    trade.buyer,
                    trade.price + trade.fee
                );
            }
        }

        trade.finished = true;

        emit TradeResolved(signer, _tradeId, _result, _reason);
    }

    /**
     * @dev Gets trade by external trade id
     * @param _tradeId External trade id
     */
    function getTrade(string memory _tradeId)
        external
        view
        returns (
            bytes memory tradeHash,
            address seller,
            address buyer,
            uint256 price,
            uint256 fee,
            uint256 timestamp,
            bool paid,
            bool approved,
            bool finished
        )
    {
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        tradeHash = trade.tradeHash;
        seller = trade.seller;
        buyer = trade.buyer;
        price = trade.price;
        fee = trade.fee;
        timestamp = trade.timestamp;
        paid = trade.paid;
        approved = trade.approved;
        finished = trade.finished;
    }
}
