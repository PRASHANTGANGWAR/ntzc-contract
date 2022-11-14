pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../lib/TransferHelper.sol";
import "../access/IAccess.sol";

contract Escrow is Initializable {
    // The counter of trades
    uint256 public tradesCounter;
    // Address of AZK token
    address public azx;
    // Address of wallet for receiving fee
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
        string[] links;
        address seller;
        address buyer;
        uint256 tradeCap;
        uint256 sellersPart;
        uint256 timeToResolve;
        uint256 resolveTS;
        uint256 linksLength;
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
        uint256 tradeCap,
        uint256 sellersPart,
        uint256 timeToResolve
    );
    event TradeValidated(string tradeId);
    event TradePaid(string tradeId, uint256 amount);
    event TradeFinished(string tradeId);
    event TradeReleased(
        string tradeId,
        address buyer,
        uint256 cap,
        uint256 sellersPart
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
     * @param _auzWallet Address of wallet for receiving fee
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
     * @dev Changes address of wallet for receiving fee (for owner only)
     * @param _wallet Address of wallet for receiving fee
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
     * @dev Get message hash for signing for validateTrade
     */
    function tradeDeskProof(
        bytes32 token,
        address user,
        bool isTradeDesk
    ) public view returns (bytes32 message) {
        message = keccak256(
            abi.encodePacked(getChainID(), token, user, isTradeDesk)
        );
    }

    /**
     * @dev Validate trade
     * @param signature Buyer's signature
     * @param user User address
     * @param isTradeDesk Is user TradeDesk
     */
    function setTradeDesk(
        bytes memory signature,
        bytes32 token,
        address user,
        bool isTradeDesk
    ) external onlyManager {
        bytes32 message = tradeDeskProof(token, user, isTradeDesk);
        address signer = IAccess(accessControl).preAuthValidations(
            message,
            token,
            signature
        );
        require(
            IAccess(accessControl).isSigner(signer),
            "HotWallet: Signer is not manager"
        );
        IAccess(accessControl).updateTradeDeskUsers(user, isTradeDesk);
    }

    /**
     * @dev Get message hash for signing for registerTrade
     */
    function registerProof(
        bytes32 _token,
        string memory _tradeId,
        string[] memory _links,
        address _seller,
        address _buyer,
        uint256 _tradeCap,
        uint256 _sellersPart,
        uint256 _timeToResolve
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(
                getChainID(),
                _token,
                _tradeId,
                _links[0],
                _seller,
                _buyer,
                _tradeCap,
                _sellersPart,
                _timeToResolve
            )
        );
    }

    /**
     * @dev Registers new trade (only for admin)
     * @param _tradeId External trade id
     * @param _seller Address of seller
     * @param _buyer Address of buyer
     * @param _tradeCap Price of trade
     * @param _sellersPart Part of tradeCap for seller
     */
    function registerTrade(
        bytes memory signature,
        bytes32 _token,
        string memory _tradeId,
        string[] memory _links,
        address _seller,
        address _buyer,
        uint256 _tradeCap,
        uint256 _sellersPart,
        uint256 _timeToResolve
    ) external onlyManager {
        require(
            tradesIdsToTrades[_tradeId] == 0,
            "Escrow: Trade is already exist"
        );
        bytes32 message = registerProof(
            _token,
            _tradeId,
            _links,
            _seller,
            _buyer,
            _tradeCap,
            _sellersPart,
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
        trade.tradeCap = _tradeCap;
        trade.sellersPart = _sellersPart;
        trade.timeToResolve = _timeToResolve;

        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }

        emit TradeRegistered(
            signer,
            _tradeId,
            _seller,
            _buyer,
            _tradeCap,
            _sellersPart,
            _timeToResolve
        );
    }

    /**
     * @dev Get message hash for signing for validateTrade
     */
    function validateProof(
        bytes32 token,
        string memory _tradeId,
        string[] memory _links
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(getChainID(), token, _tradeId, _links[0])
        );
    }

    /**
     * @dev Validate trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function validateTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        string[] memory _links
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.valid, "Escrow: Trade is validates");
        require(!trade.finished, "Escrow: Trade is finished");
        bytes32 message = validateProof(token, _tradeId, _links);
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
        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }
        emit TradeValidated(_tradeId);
    }

    /**
     * @dev Get message hash for signing for payTrade
     */
    function payProof(
        bytes32 token,
        string memory _tradeId,
        string[] memory _links,
        address _buyer
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(getChainID(), token, _tradeId, _links[0], _buyer)
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
        string[] memory _links,
        address _buyer
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.valid, "Escrow: Trade is not valid");
        require(!trade.paid, "Escrow: Trade is paid");
        require(trade.buyer != address(0), "Escrow: Buyer is not confirmed");
        bytes32 message = payProof(token, _tradeId, _links, _buyer);
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
            trade.tradeCap
        );
        trade.paid = true;
        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }

        emit TradePaid(_tradeId, trade.tradeCap);
    }

    /**
     * @dev Get message hash for signing for approveTrade
     */
    function finishProof(
        bytes32 token,
        string memory _tradeId,
        string[] memory _links
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(token, _links[0], _tradeId, getChainID())
        );
    }

    /**
     * @dev Approves trade
     * @param signature Buyer's signature
     * @param _tradeId External trade id
     */
    function finishTrade(
        bytes memory signature,
        bytes32 token,
        string memory _tradeId,
        string[] memory _links
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(!trade.finished, "Escrow: Trade is finished");
        require(trade.paid, "Escrow: Trade is not paid");
        bytes32 message = finishProof(token, _tradeId, _links);
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
        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }

        emit TradeFinished(_tradeId);
    }

    /**
     * @dev Get message hash for signing for finishTrade
     */
    function releaseProof(
        bytes32 token,
        string memory _tradeId,
        string[] memory _links,
        address _buyer
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(_buyer, getChainID(), _links[0], token, _tradeId)
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
        string[] memory _links,
        address _buyer
    ) external onlyManager {
        require(tradesIdsToTrades[_tradeId] != 0, "Escrow: Trade is not exist");
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        require(trade.buyer != address(0), "Escrow: Buyer is not confirmed");
        bytes32 message = releaseProof(token, _tradeId, _links, _buyer);
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
        TransferHelper.safeTransfer(azx, trade.seller, trade.sellersPart);
        TransferHelper.safeTransfer(
            azx,
            auzWallet,
            trade.tradeCap - trade.sellersPart
        );
        trade.released = true;
        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }

        emit TradeReleased(_tradeId, _buyer, trade.tradeCap, trade.sellersPart);
    }

    /**
     * @dev Get message hash for signing for resolveTrade
     */
    function resolveProof(
        bytes32 token,
        string memory _tradeId,
        string[] memory _links,
        bool _result,
        string memory _reason
    ) public view returns (bytes32 message) {
        if (_links.length == 0) _links[0] = "";
        message = keccak256(
            abi.encodePacked(
                getChainID(),
                token,
                _links[0],
                _tradeId,
                _result,
                _reason
            )
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
        string[] memory _links,
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

        bytes32 message = resolveProof(
            token,
            _tradeId,
            _links,
            _result,
            _reason
        );
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
                TransferHelper.safeTransfer(
                    azx,
                    trade.seller,
                    trade.sellersPart
                );
                TransferHelper.safeTransfer(
                    azx,
                    auzWallet,
                    trade.tradeCap - trade.sellersPart
                );
            } else {
                TransferHelper.safeTransfer(azx, trade.buyer, trade.tradeCap);
            }
        }

        trade.released = true;
        for (uint256 i = 0; i < _links.length; i++) {
            if (
                keccak256(abi.encodePacked(_links[i])) !=
                keccak256(abi.encodePacked(""))
            ) {
                trade.links.push(_links[i]);
                trade.linksLength++;
            }
        }

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
            string[] memory links,
            address seller,
            address buyer,
            uint256 linksLenght,
            uint256 tradeCap,
            uint256 sellersPart,
            bool valid,
            bool paid,
            bool finished,
            bool released
        )
    {
        Trade storage trade = trades[tradesIdsToTrades[_tradeId]];
        links = trade.links;
        linksLenght = trade.linksLength;
        seller = trade.seller;
        buyer = trade.buyer;
        tradeCap = trade.tradeCap;
        sellersPart = trade.sellersPart;
        valid = trade.valid;
        paid = trade.paid;
        finished = trade.finished;
        released = trade.released;
    }
}
