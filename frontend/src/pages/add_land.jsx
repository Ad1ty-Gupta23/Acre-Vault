import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { useBlockchain } from '../context/BlockchainContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LandGISMap from './land_map';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    },
  });
  return null;
};

const AddNewLand = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { account, connectWallet, registerLand, loading } = useBlockchain();

  // Map related states
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    contractName: '',
    surveyNo: '',
    area: '',
    location: '',
    documentFile: null,
    imageFile: null,
    coordinates: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add new state for document verification result
  const [verificationResult, setVerificationResult] = useState(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  // Geocoding function
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
        setFormData((prev) => ({
          ...prev,
          coordinates: `${lat}, ${lon}`,
        }));
        setIsMapVisible(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Could not find location. Please enter coordinates manually.');
    }
  };

  // Handle regular form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Special handler for location input with geocoding
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      location: value,
    });

    // Geocode after a short delay if input is substantial
    if (value.length > 5) {
      setTimeout(() => {
        geocodeAddress(value);
      }, 1000);
    }
  };

  // Handler for map clicks
  const handleMapClick = (coords) => {
    setMarkerPosition(coords);
    setFormData((prev) => ({
      ...prev,
      coordinates: `${coords[0]}, ${coords[1]}`,
    }));
  };

  // Handle document file upload
  const handleDocumentFileChange = (e) => {
    setFormData({
      ...formData,
      documentFile: e.target.files[0],
    });
  };

  // Handle image file upload
  const handleImageFileChange = (e) => {
    setFormData({
      ...formData,
      imageFile: e.target.files[0],
    });
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Likely Genuine':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'Suspicious':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'Potentially Fraudulent':
        return 'bg-red-100 border-red-400 text-red-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  // Function to close verification alert
  const closeVerificationAlert = () => {
    setShowVerificationAlert(false);
  };

  // Submit form to blockchain and backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
  
    try {
      // Step 1: Upload document to the fraud detection API
      const fraudDetectionFormData = new FormData();
      fraudDetectionFormData.append('document', formData.documentFile); // Changed 'file' to 'document' to match backend
  
      // Log the form data being sent
      console.log('Sending document for fraud detection:', formData.documentFile);
  
      const fraudDetectionResponse = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: fraudDetectionFormData,
        // Don't set Content-Type header with FormData - browser will set it automatically with boundary
      });
     
      
      console.log('Fraud detection response status:', fraudDetectionResponse.status);
      
      const fraudDetectionData = await fraudDetectionResponse.json();
      console.log('Fraud detection response:', fraudDetectionData);
  
      if (!fraudDetectionResponse.ok) {
        throw new Error(fraudDetectionData.error || 'Fraud detection failed');
      }
      
      // Set verification result and show alert
      setVerificationResult(fraudDetectionData.verification_result);
      setShowVerificationAlert(true);
  
      // Step 2: Check if the document is genuine
      if (fraudDetectionData.verification_result.status === 'Potentially Fraudulent') {
        throw new Error(`Document appears fraudulent (Risk score: ${fraudDetectionData.verification_result.risk_score}). Land registration cannot proceed.`);
      }
  
      // Step 3: Create the data object to send to the server
      const landData = {
        contractName: formData.contractName,
        surveyNo: formData.surveyNo,
        area: formData.area,
        location: formData.location,
        coordinates: formData.coordinates,
        description: formData.description,
        ownerId: user._id,
        // Add extracted data from the fraud detection if available
        extractedData: fraudDetectionData.extracted_data
      };
  
      // Upload to backend
      const response = await fetch('http://localhost:5000/verify-and-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(landData) // Use landData instead of yourData
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save land details');
      }
  
      // Step 4: Register on blockchain
      await registerLand(formData.contractName, formData.surveyNo, formData.area);
  
      setSuccess('Land registered successfully on blockchain and database!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error registering land:', err);
      setError(err.message || 'An error occurred while registering land');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not a landowner, redirect them
  if (user && user.role !== 'landowner') {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-700">
          Only landowners can register new land properties.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Register New Land</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Document Verification Alert/Popup */}
        {showVerificationAlert && verificationResult && (
          <div className={`mb-4 p-4 ${getStatusColor(verificationResult.status)} border rounded relative`}>
            <strong className="font-bold block mb-1">Document Verification: {verificationResult.status}</strong>
            <span className="block mb-2">Risk Score: {verificationResult.risk_score}%</span>
            
            {verificationResult.findings && verificationResult.findings.length > 0 && (
              <div className="mt-2">
                <strong>Findings:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {verificationResult.findings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button 
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" 
              onClick={closeVerificationAlert}
            >
              ✕
            </button>
          </div>
        )}

        {account && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <p className="text-sm">Connected wallet: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="contractName" className="block text-sm font-medium text-gray-700">
                Full Name as in Government Contract
              </label>
              <input
                type="text"
                id="contractName"
                name="contractName"
                value={formData.contractName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the exact name as written in your government contract"
              />
              <p className="mt-1 text-xs text-gray-500">
                This should match exactly with the name on your land deed document
              </p>
            </div>

            <div>
              <label htmlFor="surveyNo" className="block text-sm font-medium text-gray-700">
                Survey Number
              </label>
              <input
                type="text"
                id="surveyNo"
                name="surveyNo"
                value={formData.surveyNo}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                Area (sq. meters)
              </label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location Address
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleLocationChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start typing address..."
              />
            </div>

            {isMapVisible && (
              <div className="sm:col-span-2 h-64 mb-4 rounded-md overflow-hidden">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {markerPosition && <Marker position={markerPosition} />}
                </MapContainer>
                <p className="mt-2 text-sm text-gray-500">
                  Click on the map to adjust the exact location
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700">
                GPS Coordinates
              </label>
              <input
                type="text"
                id="coordinates"
                name="coordinates"
                value={formData.coordinates}
                onChange={handleChange}
                placeholder="e.g., 12.9716° N, 77.5946° E"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will update automatically when you select a location on the map
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Property Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="documentFile" className="block text-sm font-medium text-gray-700">
                Upload Supporting Document (Deed/Title)
              </label>
              <input
                type="file"
                id="documentFile"
                name="documentFile"
                onChange={handleDocumentFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload land deed, title or ownership proof (PDF, JPG or PNG)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">
                Upload Land Photo (Optional)
              </label>
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                onChange={handleImageFileChange}
                accept=".jpg,.jpeg,.png"
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a photo of the land (JPG or PNG)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading || !account}
              className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${(isSubmitting || loading || !account) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Processing Blockchain Transaction...' : 
               isSubmitting ? 'Saving Data...' : 
               'Register Land'}
            </button>
          </div>
        </form>
      </div>
      <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Land Location on Map</h2>
      {formData.coordinates ? (
        <LandGISMap coordinates={formData.coordinates} />
      ) : (
        <p className="text-gray-500">Enter location details to view the map.</p>
      )}
    </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800">What happens next?</h3>
        <ul className="mt-2 list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Your land details will be saved in our secure database</li>
          <li>The information will be registered on the blockchain</li>
          <li>A government official will verify your submission</li>
          <li>Once verified, you'll receive an official digital certificate</li>
          <li>You can then initiate transfers or manage your property</li>
        </ul>
      </div>
    </div>
  );
};

export default AddNewLand;