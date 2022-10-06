pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../lib/TransferHelper.sol";

contract Escrow is
    Initializable,
    OwnableUpgradeable
{
    uint256 public PERIOD_FOR_RESOLVE = 259200;
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
        uint256 timestamp;
        bool paid;
        bool approved;
        bool finished;
    }

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

    receive() external payable {}

    function initialize(address _auzToken, address _auzWallet)
        public
        initializer
    {
        __Ownable_init();
        managers[msg.sender] = true;
        auzToken = _auzToken;
        auzWallet = _auzWallet;
    }

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

        emit TradeRegistered (_tradeId, _tradeHash, _seller, _buyer, _price, _fee);
    }

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

        emit TradePaid (_tradeId, trade.price + trade.fee);
    }

    function approveTrade(string memory _tradeId) external {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.buyer == msg.sender, "Escrow: You are not a buyer");
        require(trade.paid, "Escrow: Trade is not paid");
        trade.approved = true;

        emit TradeApproved (_tradeId);
    }

    function finishTrade(string memory _tradeId) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.approved, "Escrow: Trade is not approved");
        TransferHelper.safeTransfer(auzToken, trade.seller, trade.price);
        TransferHelper.safeTransfer(auzToken, auzWallet, trade.fee);
        trade.finished = true;

        emit TradeFinished (_tradeId);
    }

    function resolveTrade(string memory _tradeId, bool _result, string memory _reason) external {
        require(managers[msg.sender] == true, "Escrow: Action is not allowed");
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(block.timestamp >= trade.timestamp + PERIOD_FOR_RESOLVE, "Escrow: To early to resolve");
        
        if (_result) {
            TransferHelper.safeTransfer(auzToken, trade.seller, trade.price);
            TransferHelper.safeTransfer(auzToken, auzWallet, trade.fee);
        } else {
             TransferHelper.safeTransfer(auzToken, trade.buyer, trade.price + trade.fee);
        }
        trade.finished = true;

        emit TradeResolved (_tradeId, _result, _reason);
    }
}
