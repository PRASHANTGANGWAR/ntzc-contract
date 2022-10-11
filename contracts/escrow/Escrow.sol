pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../lib/TransferHelper.sol";

contract Escrow is Initializable, OwnableUpgradeable {
    // The time elapsed since the registration of the trade, after which the administrator will be able to resolve the trade
    uint256 public PERIOD_FOR_RESOLVE;
    // The counter of trades
    uint256 public tradesCounter;
    // Address of AZK token
    address public auzToken;
    // Address of wallet for receiving fees
    address public auzWallet;

    // Mapping of admins addresses
    mapping(address => bool) managers;
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
        string indexed tradeId,
        bytes tradeHash,
        address seller,
        address buyer,
        uint256 price,
        uint256 fee
    );
    event TradePaid(string tradeId, uint256 amount);
    event TradeApproved(string tradeId);
    event TradeFinished(string tradeId);
    event TradeResolved(string tradeId, bool result, string reason);

    receive() external payable {
        revert("Escrow: Contract cannot work with ETH");
    }

    /**
     * @dev Initializes the contract
     * @param _auzToken Address of AZK token
     * @param _auzWallet Address of wallet for receiving fees
     */
    function initialize(address _auzToken, address _auzWallet)
        public
        initializer
    {
        __Ownable_init();
        managers[msg.sender] = true;
        auzToken = _auzToken;
        auzWallet = _auzWallet;
        PERIOD_FOR_RESOLVE = 259200;
    }

    /**
     * @dev Changes admin permissions for the address (for owner only)
     * @param _manager Address of admin
     * @param _isManager Status of admin (Is admin or not)
     */
    function changeManager(address _manager, bool _isManager)
        external
        onlyOwner
    {
        require(_manager != address(0), "Escrow: Zero address is not allowed");
        managers[_manager] = _isManager;
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
     * @dev Registers new trade (only for admin)
     * @param _tradeId External trade id
     * @param _tradeHash Hash of trade data
     * @param _seller Address of seller
     * @param _buyer Address of buyer
     * @param _price Price of trade
     * @param _fee Fee of trade
     */
    function registerTrade(
        string memory _tradeId,
        bytes memory _tradeHash,
        address _seller,
        address _buyer,
        uint256 _price,
        uint256 _fee
    ) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(
            tradesIdsToTrades[_tradeId] == 0,
            "Escrow: Trade is already exist"
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
            _tradeId,
            _tradeHash,
            _seller,
            _buyer,
            _price,
            _fee
        );
    }

    /**
     * @dev Pays for trade (only for buyer)
     * @param _tradeId External trade id
     */
    function payTrade(string memory _tradeId) external {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.buyer != address(0), "Escrow: Buyer is anot confirmed");
        require(trade.buyer == msg.sender, "Escrow: You are not a buyer");
        TransferHelper.safeTransferFrom(
            auzToken,
            msg.sender,
            address(this),
            trade.price + trade.fee
        );
        trade.paid = true;

        emit TradePaid(_tradeId, trade.price + trade.fee);
    }

    /**
     * @dev Approves trade (only for buyer)
     * @param _tradeId External trade id
     */
    function approveTrade(string memory _tradeId) external {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.buyer == msg.sender, "Escrow: You are not a buyer");
        require(trade.paid, "Escrow: Trade is not paid");
        trade.approved = true;

        emit TradeApproved(_tradeId);
    }

    /**
     * @dev Finishes trade (only for admin)
     * @param _tradeId External trade id
     */
    function finishTrade(string memory _tradeId) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.approved, "Escrow: Trade is not approved");
        TransferHelper.safeTransfer(auzToken, trade.seller, trade.price);
        TransferHelper.safeTransfer(auzToken, auzWallet, trade.fee);
        trade.finished = true;

        emit TradeFinished(_tradeId);
    }

    /**
     * @dev Resolves trade (only for admin). Uses for resolving disputes.
     * @param _tradeId External trade id
     * @param _result Result of trade
     * @param _reason Reason of trade
     */
    function resolveTrade(
        string memory _tradeId,
        bool _result,
        string memory _reason
    ) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(
            block.timestamp >= trade.timestamp + PERIOD_FOR_RESOLVE,
            "Escrow: To early to resolve"
        );

        if (_result) {
            TransferHelper.safeTransfer(auzToken, trade.seller, trade.price);
            TransferHelper.safeTransfer(auzToken, auzWallet, trade.fee);
        } else {
            TransferHelper.safeTransfer(
                auzToken,
                trade.buyer,
                trade.price + trade.fee
            );
        }
        trade.finished = true;

        emit TradeResolved(_tradeId, _result, _reason);
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
