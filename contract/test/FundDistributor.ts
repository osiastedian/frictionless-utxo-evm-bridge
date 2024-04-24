import { expect } from "chai";
import hre from "hardhat";

describe("FundDistributor", () => {
  async function deploy() {
    const [owner, alice, bob, charlie] = await hre.ethers.getSigners();

    const FundDistributor = await hre.ethers.getContractFactory(
      "FundDistributor"
    );
    const fundDistributor = await FundDistributor.deploy();

    return { owner, alice, bob, charlie, fundDistributor };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.admin()).to.equal(owner.address);
    });

    // Test that Limit is 0
    // Test that Balance is

    it("Should set the right limit", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.totalLimit()).to.equal(0);
    });

    it("Should set the right balance", async function () {
      const { owner, fundDistributor } = await deploy();

      expect(await fundDistributor.totalBalance()).to.equal(0);
    });
  });

  describe("Managing a Distributor", () => {
    it("Should add a distributor", async () => {
      const { owner, alice, fundDistributor } = await deploy();

      await fundDistributor.addDistributor(alice.address);

      expect(await fundDistributor.isDistributor(alice.address)).to.equal(true);
    });

    it("Should revert if not called by the admin", async () => {
      const { alice, fundDistributor } = await deploy();

      await expect(
        fundDistributor.connect(alice).addDistributor(alice.address)
      ).to.be.revertedWith("Only admin can call this function");
    });

    // Test increasing of limit of a distributor by admin but the contract has no balance
    it("Should increase the limit of a distributor by the admin", async () => {
      const { owner, alice, fundDistributor } = await deploy();

      await owner.sendTransaction({
        value: 100,
        to: fundDistributor.getAddress(),
      });

      await fundDistributor.addDistributor(alice.address);

      await fundDistributor.increaseLimit(alice.address, 100);

      expect(await fundDistributor.limits(alice.address)).to.equal(100);
    });

    it("should revert when increasing the limit of a distributor by the admin if the contract has no balance", async () => {
      const { owner, alice, fundDistributor } = await deploy();

      await fundDistributor.addDistributor(alice.address);

      await expect(
        fundDistributor.increaseLimit(alice.address, 100)
      ).to.be.revertedWith("Limit exceeds total balance");
    });

    it("should reduce total limit when a distributor is removed", async () => {
      const { owner, alice, fundDistributor } = await deploy();

      await owner.sendTransaction({
        value: 100,
        to: fundDistributor.getAddress(),
      });

      await fundDistributor.addDistributor(alice.address);

      await fundDistributor.increaseLimit(alice.address, 100);

      await fundDistributor.removeDistributor(alice.address);

      expect(await fundDistributor.totalLimit()).to.equal(0);
    });
  });

  describe("Distributing Funds", () => {
    const setup = async () => {
      // Deploy the contract
      const params = await deploy();
      const { owner, fundDistributor, alice } = params;
      // admin funds the contract
      await owner.sendTransaction({
        value: 100,
        to: fundDistributor.getAddress(),
      });
      // Add alice as a distributor
      await fundDistributor.addDistributor(alice.address);
      await fundDistributor.increaseLimit(alice.address, 100);
      return params;
    };

    it("Should distribute funds to a recipient", async () => {
      const { fundDistributor, alice, bob } = await setup();

      expect(await fundDistributor.limits(alice.address)).to.equal(100);

      await expect(() =>
        fundDistributor.connect(alice).distribute(bob.address, 100)
      ).to.changeEtherBalances([fundDistributor, bob], [-100, 100]);

      expect(await fundDistributor.limits(alice.address)).to.equal(0);
      expect(await fundDistributor.totalLimit()).to.equal(0);
      expect(await fundDistributor.totalBalance()).to.equal(0);
    });

    it("Should revert when non distributor to distribute", async () => {
      const { fundDistributor, bob } = await setup();

      await expect(
        fundDistributor.connect(bob).distribute(bob.address, 100)
      ).to.be.revertedWith("Only distributor can call this function");
    });

    it("Should revert if the distributor tries to distribute to itself", async () => {
      const { alice, fundDistributor } = await setup();

      await expect(
        fundDistributor.connect(alice).distribute(alice.address, 100)
      ).to.be.revertedWith("Distributor cannot distribute to itself");
    });
  });

  describe("Withdrawing", () => {
    // Test that only the admin can withdraw
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
});
