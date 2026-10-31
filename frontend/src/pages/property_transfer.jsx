import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useBlockchain } from '../context/BlockchainContext';
import { uploadDocument } from '../utils/api';
import { explorerUrl } from '../utils/format';

const PropertyTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isRegistrar, connectWallet, transferOwnership, lands, loading } = useBlockchain();

  const [propertyId, setPropertyId] = useState(location.state?.selectedLandId ?? '');
  const [newOwner, setNewOwner] = useState('');
  const [newOwnerWallet, setNewOwnerWallet] = useState('');
  const [deedFile, setDeedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [transferStatus, setTransferStatus] = useState('idle');

  const isBusy = loading || transferStatus === 'processing';

  const fail = (text) => {
    setMessage(text);
    setTransferStatus('error');
  };

  const handleTransfer = async () => {
    setTxHash('');

    if (!account) {
      return fail('Connect your wallet to transfer a property.');
    }
    if (!String(propertyId).trim() || !newOwner.trim() || !newOwnerWallet.trim()) {
      return fail("Please enter the Property ID, the new owner's name and their wallet address.");
    }
    if (!deedFile) {
      return fail('Please attach the signed transfer deed.');
    }
    if (!ethers.isAddress(newOwnerWallet.trim())) {
      return fail('The new owner wallet address is not a valid Ethereum address.');
    }

    // Find the selected property in the lands array
    const property = lands.find((land) => land.id === String(propertyId).trim());
    if (!property) {
      return fail('Property not found.');
    }
    if (!property.isVerified) {
      return fail('Property is not verified. Transfer cannot proceed.');
    }
    const isOwner = property.ownerWallet?.toLowerCase() === account.toLowerCase();
    if (!isOwner && !isRegistrar) {
      return fail('Only the wallet that owns this property can transfer it.');
    }

    setTransferStatus('processing');

    try {
      // The transfer deed replaces the registration deed as the land's current document
      setMessage('Storing the transfer deed on IPFS...');
      const documentCid = await uploadDocument(deedFile, 'transfer-deed');

      setMessage('Waiting for the transaction to be confirmed...');
      const receipt = await transferOwnership(property.id, newOwner.trim(), newOwnerWallet.trim(), documentCid);
      setTxHash(receipt?.hash || '');
      setMessage(`Property ${property.id} successfully transferred to ${newOwner.trim()}.`);
      setTransferStatus('success');
      setTimeout(() => navigate('/my_properties'), 3000);
    } catch (error) {
      fail(error.message || 'An error occurred during transfer.');
    }
  };

  const inputsDisabled = isBusy || transferStatus === 'success';

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Transfer Property</h1>

      {!account && (
        <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-800 flex items-center justify-between gap-3">
          <span>Connect the wallet that owns the property.</span>
          <button onClick={connectWallet} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">
            Connect Wallet
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          className={`mb-4 p-3 rounded ${
            transferStatus === 'success'
              ? 'bg-green-100 text-green-700'
              : transferStatus === 'processing'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
          {txHash && explorerUrl('tx', txHash) && (
            <a
              href={explorerUrl('tx', txHash)}
              target="_blank"
              rel="noreferrer"
              className="block mt-1 text-sm underline"
            >
              View transaction
            </a>
          )}
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Property ID</span>
          <input
            type="text"
            placeholder="Enter Property ID"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            disabled={inputsDisabled}
          />
        </label>

        <label className="block">
          <span className="text-gray-700">New Owner's Name</span>
          <input
            type="text"
            placeholder="Enter new owner's name"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            disabled={inputsDisabled}
          />
        </label>

        <label className="block">
          <span className="text-gray-700">New Owner's Wallet Address</span>
          <input
            type="text"
            placeholder="0x..."
            value={newOwnerWallet}
            onChange={(e) => setNewOwnerWallet(e.target.value)}
            className="w-full p-2 border rounded mt-1 font-mono text-sm"
            disabled={inputsDisabled}
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Signed Transfer Deed</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDeedFile(e.target.files[0] || null)}
            className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={inputsDisabled}
          />
          <span className="block mt-1 text-xs text-gray-500">
            Stored on IPFS and becomes this land's current document. Earlier documents stay in its history.
          </span>
        </label>

        <button
          onClick={handleTransfer}
          disabled={inputsDisabled}
          className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-400 transition"
        >
          {isBusy ? 'Processing...' : 'Transfer Ownership'}
        </button>
      </div>
    </div>
  );
};

export default PropertyTransfer;
