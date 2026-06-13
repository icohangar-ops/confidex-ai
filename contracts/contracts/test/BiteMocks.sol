// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// Test-only: pull the BITE mock contracts into the compilation unit so Hardhat
// produces artifacts for them. These mocks simulate the SKALE BITE precompiles
// (SubmitCTX / EncryptTE / EncryptECIES) and the deferred decryption callback,
// allowing the encrypted-transfer and document-access flows to be exercised in
// tests. Not deployed to production.
import { BiteMock } from "@skalenetwork/bite-solidity/test/BiteMock.sol";
import { SubmitCTXMock } from "@skalenetwork/bite-solidity/test/SubmitCTXMock.sol";
import { EncryptECIESMock } from "@skalenetwork/bite-solidity/test/EncryptECIESMock.sol";
import { EncryptTEMock } from "@skalenetwork/bite-solidity/test/EncryptTEMock.sol";
import { CallbackSender } from "@skalenetwork/bite-solidity/test/CallbackSender.sol";
