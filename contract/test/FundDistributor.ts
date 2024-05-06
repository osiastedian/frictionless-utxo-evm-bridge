import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe.only("FundDistributor", () => {
  async function deploy() {
    const [owner, alice, bob, charlie, dolly] = await hre.ethers.getSigners();

    const FundDistributor = await hre.ethers.getContractFactory(
      "FundDistributor"
    );
    const fundDistributor = await FundDistributor.deploy();

    return { owner, alice, bob, charlie, dolly, fundDistributor };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.admin()).to.equal(owner.address);
    });

    it("Should set the right limit", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.totalLimit()).to.equal(0);
    });

    it("Should set the right balance", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.totalBalance()).to.equal(0);
    });
  });

  describe("Withdrawing", () => {
    it("Should allow admins to withdraw all funds", async () => {
      const { owner, fundDistributor } = await deploy();

      await owner.sendTransaction({
        value: 100,
        to: fundDistributor.getAddress(),
      });

      const contractAddress = await fundDistributor.getAddress();

      await expect(() => fundDistributor.withdraw()).to.changeEtherBalances(
        [owner.address, contractAddress],
        [100, -100]
      );

      expect(await fundDistributor.totalBalance()).to.equal(0);
      expect(await fundDistributor.totalLimit()).to.equal(0);
      expect(await fundDistributor.isActive()).to.equal(false);
    });
  });

  describe("Account Registration", () => {
    const setup = async () => {
      const params = await deploy();
      const { fundDistributor, alice } = params;
      const accountRegistrarRole = await fundDistributor.ACCOUNT_REGISTRAR();
      await fundDistributor.addRegistrar(alice.address, accountRegistrarRole);
      return params;
    };
    it("should register a registrar", async () => {
      const { fundDistributor, alice } = await setup();
      const accountRegistrarRole = await fundDistributor.ACCOUNT_REGISTRAR();
      expect(await fundDistributor.roles(alice.address)).to.equal(
        accountRegistrarRole
      );
    });

    it("should allow registrar to register an account", async () => {
      const { fundDistributor, alice, bob } = await setup();
      const rawMessage = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
      const signature = await bob.signMessage(rawMessage);
      await fundDistributor
        .connect(alice)
        .registerAccount(bob.address, rawMessage, signature);
      expect(await fundDistributor.receiverAddress(rawMessage)).to.equal(
        bob.address
      );
    });
  });

  describe("Transaction Registration", () => {
    const setup = async () => {
      const params = await deploy();
      const { fundDistributor, alice, bob } = params;
      const accountRegistrarRole = await fundDistributor.ACCOUNT_REGISTRAR();
      const transactionRegistrarRole =
        await fundDistributor.TRANSACTION_REGISTRAR();
      await fundDistributor.addRegistrar(alice.address, accountRegistrarRole);
      await fundDistributor.addRegistrar(bob.address, transactionRegistrarRole);
      return params;
    };

    it("should register a transaction registrar", async () => {
      const { fundDistributor, bob } = await setup();
      const transactionRegistrarRole =
        await fundDistributor.TRANSACTION_REGISTRAR();
      expect(await fundDistributor.roles(bob.address)).to.equal(
        transactionRegistrarRole
      );
    });

    it("should not allow to register a transaction if the account is not registered", async () => {
      const { fundDistributor, bob } = await setup();
      const txId =
        "e573e0cb1582867789d12cbaef4c2230b4289669e5955a46cf4471b2b7c6c38a";
      const depositAccount = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
      const amount = ethers.parseEther("1");
      await expect(
        fundDistributor
          .connect(bob)
          .registerTransaction(txId, depositAccount, amount)
      ).to.be.revertedWith("Account not registered");
    });

    it("should not allow double registration of tx", async () => {
      const { fundDistributor, alice, bob, charlie } = await setup();
      const depositorAddress = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
      const signature = await charlie.signMessage(depositorAddress);
      await fundDistributor
        .connect(alice)
        .registerAccount(charlie.address, depositorAddress, signature);
      const txId =
        "e573e0cb1582867789d12cbaef4c2230b4289669e5955a46cf4471b2b7c6c38a";
      const depositAccount = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
      const amount = ethers.parseEther("1");

      await expect(
        fundDistributor
          .connect(bob)
          .registerTransaction(txId, depositAccount, amount)
      )
        .to.emit(fundDistributor, "TransactionPending")
        .withArgs(bob.address, txId, depositorAddress, amount);

      await expect(
        fundDistributor
          .connect(bob)
          .registerTransaction(txId, depositAccount, amount)
      ).to.be.revertedWith("Transaction is already registered");
    });
  });

  describe("Transaction Payout", () => {
    const txId =
      "e573e0cb1582867789d12cbaef4c2230b4289669e5955a46cf4471b2b7c6c38a";
    const depositAccount = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
    const amountInEther = ethers.parseEther("1");

    const setup = async () => {
      const params = await deploy();
      const { fundDistributor, alice, bob, charlie, dolly, owner } = params;
      const accountRegistrarRole = await fundDistributor.ACCOUNT_REGISTRAR();
      const transactionRegistrarRole =
        await fundDistributor.TRANSACTION_REGISTRAR();
      const payoutRegistrarRole = await fundDistributor.PAYOUT_REGISTRAR();

      // Add registrars
      await fundDistributor.addRegistrar(alice.address, accountRegistrarRole);
      await fundDistributor.addRegistrar(bob.address, transactionRegistrarRole);
      await fundDistributor.addRegistrar(charlie.address, payoutRegistrarRole);

      // Admin fund the contract
      await owner.sendTransaction({
        value: amountInEther,
        to: fundDistributor.getAddress(),
      });

      // Increase limit for Payout Registrar
      await fundDistributor
        .connect(owner)
        .increaseLimit(charlie.address, amountInEther);

      // Register Dolly's account (User) by ACCOUNT_REGISTRAR
      const signedMessage = await dolly.signMessage(depositAccount);
      await fundDistributor
        .connect(alice)
        .registerAccount(dolly.address, depositAccount, signedMessage);

      // Register Dolly's deposit transaction id by TRANSACTION_REGISTRAR
      await fundDistributor
        .connect(bob)
        .registerTransaction(txId, depositAccount, amountInEther);

      return params;
    };

    it("should allow a successful payout", async () => {
      const { fundDistributor, charlie, dolly } = await setup();
      const contractAddress = await fundDistributor.getAddress();

      // Payout Registrar verifies the transaction and pays out
      await expect(() =>
        fundDistributor.connect(charlie).payout(txId)
      ).to.changeEtherBalances(
        [contractAddress, dolly.address],
        [`-${amountInEther}`, amountInEther]
      );
    });

    it("should not allow  payout for unreigstered transaction", async () => {
      const { fundDistributor, charlie } = await setup();
      const txId2 =
        "e573e0cb1582867789d12cbaef4c2230b4289669e5955a46cf4471b2b7c6c38b";

      await expect(
        fundDistributor.connect(charlie).payout(txId2)
      ).to.be.revertedWith("Transaction is not registered");
    });
  });
});
