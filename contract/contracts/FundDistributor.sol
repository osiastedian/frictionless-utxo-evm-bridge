// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "hardhat/console.sol";

contract FundDistributor {
    uint public constant ACCOUNT_REGISTRAR = 1;
    uint public constant PAYOUT_REGISTRAR = 2;
    uint public constant TRANSACTION_REGISTRAR = 3;

    uint public constant TX_STATUS_PENDING = 1;
    uint public constant TX_STATUS_COMPLETED = 2;

    address payable public admin;
    uint public totalLimit;
    mapping(address => uint) public limits;
    mapping(address => uint8) public roles;

    mapping(string => address) public receiverAddress;

    mapping(string => string) public txRegistration;
    mapping(string => uint) public txAmount;
    mapping(string => uint) public txStatus;

    bool public isActive = true;

    event TransactionComplete(
        address indexed registrar,
        string indexed txId,
        address indexed to,
        uint amount
    );
    event TransactionPending(
        address indexed registrar,
        string indexed txId,
        string indexed depositor,
        uint amount
    );
    event RegisterReceiver(
        address indexed receiver,
        string indexed depositAddress
    );
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

    function changeOwnership(address payable newAdmin) public onlyAdmin {
        admin = newAdmin;
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
        string calldata depositAddress,
        bytes calldata signedMessage
    ) public onlyAccountRegistrar contractActive {
        bytes32 hashedMessage = MessageHashUtils.toEthSignedMessageHash(
            bytes(depositAddress)
        );
        require(receiver != address(0), "Can't register zero address");
        require(
            receiverAddress[depositAddress] == address(0),
            "Receiver address is already registered"
        );

        address signer = ECDSA.recover(hashedMessage, signedMessage);
        console.log("Signer: %s, receiver: %s", signer, receiver);

        require(
            signer == receiver,
            "Signer address is not the same as the receiver address"
        );

        receiverAddress[depositAddress] = receiver;

        emit RegisterReceiver(receiver, depositAddress);
    }

    function registerTransaction(
        string calldata txid,
        string calldata depositorAddress,
        uint amount
    ) public onlyTransactionRegistrar contractActive {
        require(
            receiverAddress[depositorAddress] != address(0),
            "Account not registered"
        );
        require(
            bytes(txRegistration[txid]).length == 0,
            "Transaction is already registered"
        );

        txRegistration[txid] = depositorAddress;
        txAmount[txid] = amount;
        txStatus[txid] = TX_STATUS_PENDING;

        emit TransactionPending(msg.sender, txid, depositorAddress, amount);
    }

    function payout(
        string calldata txId
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
