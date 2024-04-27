// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract FundDistributor {
    uint8 public constant ACCOUNT_REGISTRAR = 1;
    uint8 public constant PAYOUT_REGISTRAR = 2;
    uint8 public constant TRANSACTION_REGISTRAR = 3;

    uint8 public constant TX_STATUS_PENDING = 1;
    uint8 public constant TX_STATUS_COMPLETED = 2;

    address payable public admin;
    uint public totalLimit;
    mapping(address => uint) public limits;
    mapping(address => uint8) public roles;

    mapping(bytes32 => address) public receiverAddress;

    mapping(bytes32 => bytes32) public txRegistration;
    mapping(bytes32 => uint) public txAmount;
    mapping(bytes32 => uint8) public txStatus;

    bool public isActive = true;

    event TransactionComplete(
        address indexed registrar,
        bytes32 indexed txId,
        address indexed to,
        uint amount
    );
    event TransactionPending(
        address indexed registrar,
        bytes32 indexed txId,
        bytes32 indexed depositor,
        uint amount
    );
    event RegisterReceiver(address indexed receiver, address indexed signer);
    event Withdraw(address indexed admin, uint amount);

    constructor() {
        admin = payable(msg.sender);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyPayoutRegistrar() {
        require(
            roles[msg.sender] == PAYOUT_REGISTRAR,
            "Only distributor can call this function"
        );
        _;
    }

    modifier onlyTransactionRegistrar() {
        require(
            roles[msg.sender] == TRANSACTION_REGISTRAR,
            "Only transaction registrar can call this function"
        );
        _;
    }

    modifier onlyAccountRegistrar() {
        require(
            roles[msg.sender] == ACCOUNT_REGISTRAR,
            "Only registrar can call this function"
        );
        _;
    }

    modifier contractActive() {
        require(isActive, "Contract is not active");
        _;
    }

    function addRegistrar(
        address registrar,
        uint8 role
    ) public onlyAdmin contractActive {
        require(roles[registrar] == 0, "Registrar is already added");
        roles[registrar] = role;
    }

    function removeRegistrar(
        address registrar
    ) public onlyAdmin contractActive {
        roles[registrar] = 0;
    }

    function registerAccount(
        address receiver,
        bytes32 message,
        bytes memory signedMessage
    ) public onlyAccountRegistrar contractActive {
        require(receiver != address(0), "Can't register zero address");
        require(
            receiverAddress[message] == address(0),
            "Receiver address is already registered"
        );

        address signer = ECDSA.recover(message, signedMessage);

        require(
            signer == receiver,
            "Signer address is not the same as the receiver address"
        );

        receiverAddress[message] = receiver;

        emit RegisterReceiver(receiver, signer);
    }

    function registerTransaction(
        bytes32 txid,
        bytes32 receiverId,
        uint amount
    ) public onlyTransactionRegistrar contractActive {
        require(
            receiverAddress[receiverId] != address(0),
            "Account not registered"
        );
        require(
            txRegistration[txid] == bytes32(0),
            "Transaction is already registered"
        );

        txRegistration[txid] = receiverId;
        txAmount[txid] = amount;
        txStatus[txid] = TX_STATUS_PENDING;

        emit TransactionPending(msg.sender, txid, receiverId, amount);
    }

    function payout(
        bytes32 txId
    ) public payable onlyPayoutRegistrar contractActive {
        require(txStatus[txId] != 0, "Transaction is not registered");
        require(
            txStatus[txId] == TX_STATUS_PENDING,
            "Transaction is already completed"
        );

        address payable to = payable(receiverAddress[txRegistration[txId]]);
        uint amount = txAmount[txId];
        txStatus[txId] = TX_STATUS_COMPLETED;
        distribute(to, amount);
        emit TransactionComplete(msg.sender, txId, to, amount);
    }

    function increaseLimit(
        address payoutRegistrar,
        uint limit
    ) public onlyAdmin contractActive {
        require(
            totalLimit + limit <= totalBalance(),
            "Limit exceeds total balance"
        );
        totalLimit += limit;
        limits[payoutRegistrar] += limit;
    }

    function distribute(
        address payable to,
        uint amount
    ) private onlyPayoutRegistrar contractActive {
        require(to != msg.sender, "Distributor cannot distribute to itself");
        require(to != address(0), "Can't distribute to zero address");
        require(roles[to] == 0, "Can't distribute to registrar");
        require(amount > 0, "Amount should be greater than 0");
        require(amount <= totalLimit, "Amount exceeds total limit");
        require(
            amount <= limits[msg.sender],
            "Amount exceeds distributor limit"
        );

        totalLimit -= amount;
        limits[msg.sender] -= amount;

        to.transfer(amount);
    }

    function withdraw() public payable onlyAdmin contractActive {
        isActive = false;
        totalLimit = 0;
        admin.transfer(totalBalance());

        emit Withdraw(admin, totalBalance());
    }

    function totalBalance() public view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}
}
