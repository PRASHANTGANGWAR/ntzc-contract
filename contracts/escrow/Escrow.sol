pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../lib/TransferHelper.sol";
import "../access/IAccess.sol";

contract Escrow is Initializable {
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
        address seller;
        address buyer;
        uint256 price;
        uint256 fee;
        uint256 timeToResolve;
        uint256 resolveTS;
        bool valid;
        bool paid;
        bool finished;
        bool released;
    }

    // Events
    event TradeRegistered(
        address signer,
        string indexed tradeId,
        address seller,
        address buyer,
        uint256 price,
        uint256 fee,
        uint256 timeToResolve
    );
    event TradeValidated(string tradeId);
    event TradePaid(string tradeId, uint256 amount);
    event TradeFinished(string tradeId);
    event TradeReleased(
        string tradeId,
        address buyer,
        uint256 cap,
        uint256 fee
    );
    event TradeResolved(
        address signer,
        string tradeId,
        bool result,
        string reason
    );

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

    modifier onlyTradeDesk() {
        require(
            IAccess(accessControl).isTradeDesk(msg.sender),
            "HotWallet: Only TradeDesk is allowed"
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
        address _seller,
        address _buyer,
        uint256 _price,
        uint256 _fee,
        uint256 _timeToResolve
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(
                getChainID(),
                _token,
                _tradeId,
                _seller,
                _buyer,
                _price,
                _fee,
                _timeToResolve
            )
        );
    }

    /**
     * @dev Registers new trade (only for admin)
     * @param _tradeId External trade id
     * @param _seller Address of seller
     * @param _buyer Address of buyer
     * @param _price Price of trade
     * @param _fee Fee of trade
     */
    function registerTrade(
        bytes memory signature,
        bytes32 _token,
        string memory _tradeId,
        address _seller,
        address _buyer,
        uint256 _price,
        uint256 _fee,
        uint256 _timeToResolve
    ) external onlyManager {
        require(
            tradesIdsToTrades[_tradeId] == 0,
            "Escrow: Trade is already exist"
        );
        bytes32 message = registerProof(
            _token,
            _tradeId,
            _seller,
            _buyer,
            _price,
            _fee,
            _timeToResolve
        );
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            _token,
            signature
        );
        require(
            IAccess(accessControl).isTradeDesk(signer),
            "HotWallet: Signer is not TradeDesk"
        );
        tradesCounter++;
        tradesIdsToTrades[_tradeId] = tradesCounter;
        Trade storage trade = trades[tradesCounter];
        trade.tradeId = _tradeId;
        trade.seller = _seller;
        trade.buyer = _buyer;
        trade.price = _price;
        trade.fee = _fee;
        trade.timeToResolve = _timeToResolve;

        emit TradeRegistered(
            signer,
            _tradeId,
            _seller,
            _buyer,
            _price,
            _fee,
            _timeToResolve
        );
    }

    /**
     * @dev Get message hash for signing for validateTrade
     */
    function validateProof(bytes32 token, string memory _tradeId)
        public
        view
        returns (bytes32 message)
    {
        message = keccak256(abi.encodePacked(getChainID(), token, _tradeId));
    }

    /**
     * @dev Validate trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function validateTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.valid, "Escrow: Trade is validates");
        require(!trade.finished, "Escrow: Trade is finished");
        bytes32 message = validateProof(token, _tradeId);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "HotWallet: Signer is not manager"
        );
        trade.valid = true;
        emit TradeValidated(_tradeId);
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
        require(trade.valid, "Escrow: Trade is not valid");
        require(!trade.paid, "Escrow: Trade is paid");
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
    function finishProof(bytes32 token, string memory _tradeId)
        public
        view
        returns (bytes32 message)
    {
        message = keccak256(abi.encodePacked(token, _tradeId, getChainID()));
    }

    /**
     * @dev Approves trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function finishTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.paid, "Escrow: Trade is not paid");
        bytes32 message = finishProof(token, _tradeId);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isTradeDesk(signer),
            "HotWallet: Signer is not TradeDesk"
        );
        trade.finished = true;
        trade.resolveTS = block.timestamp + trade.timeToResolve;

        emit TradeFinished(_tradeId);
    }

    /**
     * @dev Get message hash for signing for finishTrade
     */
    function releaseProof(
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(_buyer, getChainID(), token, _tradeId)
        );
    }

    /**
     * @dev Finishes trade (only for admin)
     * @param _tradeId External trade id
     */
    function releaseTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        address _buyer
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.buyer != address(0), "Escrow: Buyer is not confirmed");
        bytes32 message = releaseProof(token, _tradeId, _buyer);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            trade.buyer == signer && trade.buyer == _buyer,
            "Escrow: Signer is not a buyer"
        );
        require(!trade.released, "Escrow: Trade is released");
        require(trade.finished, "Escrow: Trade is not finished");
        TransferHelper.safeTransfer(azx, trade.seller, trade.price - trade.fee);
        TransferHelper.safeTransfer(azx, auzWallet, trade.fee);
        trade.released = true;

        emit TradeReleased(_tradeId, _buyer, trade.price, trade.fee);
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
        require(!trade.released, "Escrow: Trade is released");
        require(
            block.timestamp >= trade.resolveTS,
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
                TransferHelper.safeTransfer(azx, trade.seller, trade.price - trade.fee);
                TransferHelper.safeTransfer(azx, auzWallet, trade.fee);
            } else {
                TransferHelper.safeTransfer(
                    azx,
                    trade.buyer,
                    trade.price + trade.fee
                );
            }
        }

        trade.released = true;

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
            address seller,
            address buyer,
            uint256 price,
            uint256 fee,
            bool valid,
            bool paid,
            bool finished,
            bool released
        )
    {
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        seller = trade.seller;
        buyer = trade.buyer;
        price = trade.price;
        fee = trade.fee;
        valid = trade.valid;
        paid = trade.paid;
        finished = trade.finished;
        released = trade.released;
    }
}
