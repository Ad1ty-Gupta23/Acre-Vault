import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const PropertyTransfer = () => {
  const navigate = useNavigate();
  const { transferOwnership, lands, loading } = useBlockchain();

  const [propertyId, setPropertyId] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [message, setMessage] = useState('');
  const [transferStatus, setTransferStatus] = useState('idle');

  const handleTransfer = async () => {
    if (!propertyId.trim() || !newOwner.trim()) {
      setMessage('❌ Please enter both Property ID and the New Owner\'s name.');
      setTransferStatus('error');
      return;
    }

    setTransferStatus('checking');
    setMessage('🔍 Checking property verification status...');

    try {
      // Find the selected property in the lands array
      const property = lands.find(land => land.id === propertyId);

      if (!property) {
        setMessage('❌ Property not found.');
        setTransferStatus('error');
        return;
      }

      if (!property.isVerified) {
        setMessage('❌ Property is not verified. Transfer cannot proceed.');
        setTransferStatus('error');
        return;
      }

      setTransferStatus('processing');
      setMessage('');

      await transferOwnership(propertyId, newOwner);
      setMessage(`✅ Property ${propertyId} successfully transferred to ${newOwner}.`);
      setTransferStatus('success');

      setTimeout(() => navigate('/my_properties'), 3000);
    } catch (error) {
      setMessage(error.message || '❌ An error occurred during transfer.');
      setTransferStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Transfer Property</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${transferStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
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
            disabled={transferStatus !== 'idle' || loading}
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
            disabled={transferStatus !== 'idle' || loading}
          />
        </label>

        <button
          onClick={handleTransfer}
          disabled={loading || transferStatus === 'processing' || transferStatus === 'checking'}
          className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-400 transition"
        >
          {loading || transferStatus === 'processing' || transferStatus === 'checking'
            ? 'Processing...'
            : 'Transfer Ownership'}
        </button>
      </div>
    </div>
  );
};

export default PropertyTransfer;
