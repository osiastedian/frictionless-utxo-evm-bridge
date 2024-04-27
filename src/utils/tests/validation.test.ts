import { ethers } from "ethers";
import {} from "@bitcoinerlab/secp256k1";
import {
  isValidAmount,
  isValidEthAddress,
  isValidSyscoinAddress,
  verifySignedMessage,
} from "../validations";

describe("isValidSyscoinAddress", () => {
  it("should return true if the address is valid", () => {
    const address = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
    expect(isValidSyscoinAddress(address)).toBe(true);
  });

  it("should return false if the address is invalid", () => {
    const address = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn";
    expect(isValidSyscoinAddress(address)).toBe(false);
  });
});

describe("isValidAmount", () => {
  it("should return true if the amount is valid", () => {
    const amount = 0.0002;
    expect(isValidAmount(amount)).toBe(true);
  });

  it("should return false if the amount is invalid", () => {
    const amount = 1001;
    expect(isValidAmount(amount)).toBe(false);
  });
});

describe("isValidEthAddress", () => {
  it("should return true if the address is valid", () => {
    const address = "0x1A7F6830F13aa0B7E9AAC95a6C12244414E5821b";
    expect(isValidEthAddress(address)).toBe(true);
  });

  it("should return false if the address is invalid", () => {
    const address = "0x0000000000000000000000000000000000000000";
    expect(isValidEthAddress(address)).toBe(false);
  });
});

describe("verifySignedMessage", () => {
  it("should return true if the signature is valid", async () => {
    const sampleMessage = "sys1qa2esanq7szrpckvlcnu6gwksc4p5xd4efjn408";
    const alice = ethers.Wallet.createRandom();

    const signedMessage = await alice.signMessage(sampleMessage);

    expect(
      verifySignedMessage(sampleMessage, alice.address, signedMessage)
    ).toBe(true);
  });
});
