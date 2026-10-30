import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useBlockchain } from '../context/BlockchainContext';
import { EXPLORER_URL } from '../config';

const PropertyTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isRegistrar, connectWallet, transferOwnership, lands, loading } = useBlockchain();

  const [propertyId, setPropertyId] = useState(location.state?.selectedLandId ?? '');
  const [newOwner, setNewOwner] = useState('');
  const [newOwnerWallet, setNewOwnerWallet] = useState('');
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
    setMessage('Waiting for the transaction to be confirmed...');

    try {
      const receipt = await transferOwnership(property.id, newOwner.trim(), newOwnerWallet.trim());
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
          {txHash && (
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
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
