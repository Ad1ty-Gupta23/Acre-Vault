const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let registry, admin, owner, buyer, stranger;

  beforeEach(async function () {
    [admin, owner, buyer, stranger] = await ethers.getSigners();
    registry = await ethers.deployContract("LandRegistry");
    await registry.connect(owner).registerLand("Alice", "S-101", 1500);
  });

  it("records the registering wallet as the owner wallet", async function () {
    const land = await registry.lands(1);
    expect(land.owner).to.equal("Alice");
    expect(land.isVerified).to.equal(false);
    expect(await registry.landOwnerWallet(1)).to.equal(owner.address);
  });

  it("rejects empty or zero-area registrations", async function () {
    await expect(registry.registerLand("", "S-1", 1)).to.be.revertedWith("Owner required");
    await expect(registry.registerLand("Bob", "", 1)).to.be.revertedWith("Survey number required");
    await expect(registry.registerLand("Bob", "S-1", 0)).to.be.revertedWith("Area must be positive");
  });

  describe("verifyLand", function () {
    it("lets a registrar verify", async function () {
      await expect(registry.verifyLand(1)).to.emit(registry, "LandVerified").withArgs(1, admin.address);
      expect((await registry.lands(1)).isVerified).to.equal(true);
    });

    it("blocks non-registrars, including the owner", async function () {
      await expect(registry.connect(owner).verifyLand(1)).to.be.revertedWith("Only registrar");
      await expect(registry.connect(stranger).verifyLand(1)).to.be.revertedWith("Only registrar");
    });

    it("rejects unknown and already-verified land", async function () {
      await expect(registry.verifyLand(99)).to.be.revertedWith("Land does not exist");
      await registry.verifyLand(1);
      await expect(registry.verifyLand(1)).to.be.revertedWith("Land already verified");
    });

    it("lets the admin add and remove registrars", async function () {
      await registry.setRegistrar(stranger.address, true);
      await registry.connect(stranger).verifyLand(1);
      await registry.setRegistrar(stranger.address, false);
      expect(await registry.isRegistrar(stranger.address)).to.equal(false);
      await expect(registry.connect(owner).setRegistrar(owner.address, true)).to.be.revertedWith("Only admin");
    });
  });

  describe("transferOwnership", function () {
    it("requires the land to be verified", async function () {
      await expect(
        registry.connect(owner).transferOwnership(1, "Bob", buyer.address)
      ).to.be.revertedWith("Land is not verified");
    });

    it("lets the owner wallet transfer, and hands control to the new wallet", async function () {
      await registry.verifyLand(1);
      await expect(registry.connect(owner).transferOwnership(1, "Bob", buyer.address))
        .to.emit(registry, "OwnershipTransferred")
        .withArgs(1, "Bob", buyer.address);

      expect((await registry.lands(1)).owner).to.equal("Bob");
      expect(await registry.landOwnerWallet(1)).to.equal(buyer.address);

      // The previous owner can no longer move it
      await expect(
        registry.connect(owner).transferOwnership(1, "Alice", owner.address)
      ).to.be.revertedWith("Only the owner or a registrar can transfer");
    });

    it("blocks strangers", async function () {
      await registry.verifyLand(1);
      await expect(
        registry.connect(stranger).transferOwnership(1, "Mallory", stranger.address)
      ).to.be.revertedWith("Only the owner or a registrar can transfer");
    });

    it("lets a registrar transfer (inheritance)", async function () {
      await registry.verifyLand(1);
      await registry.transferOwnership(1, "Alice Jr", buyer.address);
      expect(await registry.landOwnerWallet(1)).to.equal(buyer.address);
    });

    it("rejects an empty name or zero wallet", async function () {
      await registry.verifyLand(1);
      await expect(
        registry.connect(owner).transferOwnership(1, "", buyer.address)
      ).to.be.revertedWith("New owner required");
      await expect(
        registry.connect(owner).transferOwnership(1, "Bob", ethers.ZeroAddress)
      ).to.be.revertedWith("New owner wallet required");
    });
  });
});
