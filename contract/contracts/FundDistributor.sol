// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Role: Admin (1), Distributor (2)

// Requierements:
// - Admin can add and remove Distributors
// - Distributors can distribute funds to another address
//   - address should not be the zero address
//   - amount should be greater than 0
//   - distributor can only distribute up to a limit set by the admin
// - Admin can withdraw all funds
//   - effectively destroying the contract
// - Admin can limit the amount of funds that can be distributed by a distributor
// - Admin can increase the limit of the amount of funds that can be distributed by a distributor
//   - check limit does not exceed the total balance of the contract

contract FundDistributor {
    address payable public admin;
    uint public totalLimit;
    mapping(address => uint) public limits;
    mapping(address => bool) public isDistributor;
    bool public isActive = true;

    event Distribute(
        address indexed distributor,
        address indexed to,
        uint amount
    );
    event Withdraw(address indexed admin, uint amount);

    constructor() {
        admin = payable(msg.sender);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyDistributor() {
        require(
            isDistributor[msg.sender],
            "Only distributor can call this function"
        );
        _;
    }

    modifier contractActive() {
        require(isActive, "Contract is not active");
        _;
    }

    function addDistributor(
        address distributor
    ) public onlyAdmin contractActive {
        isDistributor[distributor] = true;
    }

    function removeDistributor(
        address distributor
    ) public onlyAdmin contractActive {
        isDistributor[distributor] = false;
        totalLimit -= limits[distributor];
        limits[distributor] = 0;
    }

    function increaseLimit(
        address distributor,
        uint limit
    ) public onlyAdmin contractActive {
        require(
            totalLimit + limit <= totalBalance(),
            "Limit exceeds total balance"
        );
        totalLimit += limit;
        limits[distributor] += limit;
    }

    function distribute(
        address payable to,
        uint amount
    ) public onlyDistributor contractActive {
        require(to != msg.sender, "Distributor cannot distribute to itself");
        require(to != address(0), "Can't distribute to zero address");
        require(amount > 0, "Amount should be greater than 0");
        require(amount <= totalLimit, "Amount exceeds total limit");
        require(
            amount <= limits[msg.sender],
            "Amount exceeds distributor limit"
        );

        totalLimit -= amount;
        limits[msg.sender] -= amount;

        to.transfer(amount);

        emit Distribute(msg.sender, to, amount);
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
