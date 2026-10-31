# AcreVault – Land Registry Management System

A blockchain-based land registry. Landowners register land, government
registrars verify it on-chain, owners transfer verified land wallet-to-wallet,
heirs claim inherited land, and anyone can look up a land record and its full
ownership history.

## Architecture

| Part | Location | Port | Purpose |
| --- | --- | --- | --- |
| Frontend | `frontend/` (React + Vite + Tailwind) | 5173 | The website |
| Auth & claims API | `app.js`, `backend/` (Express + MongoDB) | 5001 | Accounts, roles, inheritance claims |
| Document checks | `fraud.py` (Flask + Tesseract) | 5000 | OCR and fraud checks on uploaded deeds |
| Assistant | `chat.py` (FastAPI + Chroma) | 8000 | Q&A chatbot with voice input/output |
| Smart contract | `blockchain/` (Hardhat, Solidity) | – | `LandRegistry` on Holesky or the PoA network |
| PoA network | `blockchain/poa-network/` (Besu, QBFT) | 8545 | Private proof-of-authority chain run by government validators |

## Roles

- **Landowner** – registers land (signed by their wallet) and transfers verified land.
- **Buyer** – browses the registry and can submit inheritance claims.
- **Government official** – verifies land, reviews inheritance claims and approves
  new officials. New official accounts can't log in until approved.

On-chain, only **registrar** wallets can verify land, and only the owner's wallet
(or a registrar, for approved inheritance claims) can transfer it.

## Documents on IPFS

Every land carries an ownership document stored on IPFS (pinned through
[Pinata](https://pinata.cloud) by the Express API, `POST /api/documents`):

- **Registration** pins the deed; its CID is stored on-chain with the land.
- **Transfer** requires the signed transfer deed, which becomes the land's current
  document (`landDocumentCid`).
- **Inheritance** claims include a supporting document (e.g. a legal heir
  certificate), which becomes the current document when an official approves.

Every earlier document stays linked from the land's ownership history, because
each `LandRegistered` / `OwnershipTransferred` event records its CID. A CID is a
fingerprint of the file's contents, so a recorded document can't be swapped
without the change showing on-chain.

> **Privacy:** files on public IPFS can be downloaded by anyone who has the CID,
> and the CIDs are public on the blockchain. Don't upload documents containing
> Aadhaar/PAN numbers or other personal data in the clear; redact them, or
> encrypt files before upload and share keys only with the parties involved.

## Setup

1. Install dependencies:

   ```bash
   npm install
   (cd blockchain && npm install)
   pip install -r requirements.txt   # also install the Tesseract OCR binary
   ```

2. Copy `.env.example` to `.env` and `blockchain/.env.example` to
   `blockchain/.env`, then fill in the values (MongoDB URL, JWT secret, deployer
   key, Pinata JWT, ...). Never commit `.env` files.

3. Deploy the contract (or reuse an existing deployment):

   ```bash
   cd blockchain
   npm test                  # run the contract tests
   npm run deploy:holesky    # prints the address and deployment block
   ```

   Put the printed values in `VITE_CONTRACT_ADDRESS` and `VITE_DEPLOY_BLOCK` in
   the root `.env`. The deploying wallet is the contract admin and a registrar;
   grant other officials' wallets the registrar role with:

   ```bash
   CONTRACT_ADDRESS=0x... REGISTRAR=0x... npx hardhat run scripts/setRegistrar.js --network holesky
   ```

4. Approve the first government official (later officials can be approved from
   the Verify page):

   ```bash
   npm run approve-official -- official@example.gov
   ```

5. Run everything:

   ```bash
   npm start          # Express API + Vite dev server
   python fraud.py    # document checks
   python chat.py     # assistant
   ```

### Proof-of-authority network

To run the registry on a private chain where only approved government validators
produce blocks (Hyperledger Besu, QBFT), see
[`blockchain/poa-network/README.md`](blockchain/poa-network/README.md):
`npm run poa:setup`, `npm run poa:start` and `npm run deploy:poa` in `blockchain/`.

### Local blockchain

For development without Holesky, run `npx hardhat node` in `blockchain/`, deploy
with `--network localhost`, and set `VITE_RPC_URL=http://127.0.0.1:8545` and
`VITE_CHAIN_ID=31337`.
