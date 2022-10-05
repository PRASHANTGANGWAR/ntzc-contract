pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../lib/TransferHelper.sol";

contract Escrow is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    uint256 public tradesCounter;
    address public auzToken;
    address public auzWallet;

    mapping(address => bool) managers;
    mapping(uint256 => Trade) public trades;
    mapping(string => uint256) public tradesIdsToTrades;

    struct Trade {
        string tradeId;
        bytes tradeHash;
        address token;
        address seller;
        address buyer;
        uint256 price;
        uint256 fee;
        bool registered;
        bool confirmed;
        bool paid;
        bool approved;
        bool finished;
    }

    event TradeRegistered();
    event BuyerConfirmed();
    event TradePaid();
    event TradeApproved();
    event TradeFinished();

    receive() external payable {}

    function initialize(address _auzToken, address _auzWallet)
        public
        initializer
    {
        __Ownable_init();
        __ReentrancyGuard_init();
        managers[msg.sender] = true;
        auzToken = _auzToken;
        auzWallet = _auzWallet;
    }

    function registerTrade(
        string memory _tradeId,
        bytes memory _tradeHash,
        address _seller,
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
        trade.price = _price;
        trade.fee = _fee;
        trade.registered = true;
    }

    function confirmBuyer(string memory _tradeId, address _buyer) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.registered, "Escrow: Trade is not exist");
        require(!trade.confirmed, "Escrow: Buyer is already confirmed");
        require(
            trade.buyer == address(0),
            "Escrow: Buyer is already confirmed"
        );
        trade.buyer = _buyer;
        trade.confirmed = true;
    }

    function payForTrade(string memory _tradeId) external {
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
    }

    function approveTrade(string memory _tradeId) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.paid, "Escrow: Trade is not paid");
        trade.approved = true;
    }

    function finishTrade(string memory _tradeId) external {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.approved, "Escrow: Trade is not approved");
        require(trade.buyer == msg.sender, "Escrow: You are not a buyer");
        TransferHelper.safeTransfer(auzToken, trade.seller, trade.price);
        TransferHelper.safeTransfer(auzToken, auzWallet, trade.fee);
        trade.finished = true;
    }
}
