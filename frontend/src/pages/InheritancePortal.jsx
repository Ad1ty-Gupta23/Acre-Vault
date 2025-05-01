import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";
// Import the JSON file containing death certificates data
import deathCertificates from "../lib/deathCertificates.json";

const InheritancePortal = () => {
  const [landId, setLandId] = useState("");
  const [parentName, setParentName] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [message, setMessage] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  // Get the transferOwnership function from your BlockchainContext
  const { transferOwnership } = useBlockchain();

  // Function to validate certificate info using local JSON data
  const validateCertificate = (certificateId, parentName) => {
    const cert = deathCertificates.deathCertificates.find(
      (entry) =>
        entry.certificateId === certificateId &&
        entry.parent.toLowerCase() === parentName.toLowerCase()
    );
    return cert ? cert.heir : null;
  };

  const handleSubmit = async () => {
    if (!landId || !parentName || !certificateId) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLocalLoading(true);
    setMessage("Processing inheritance claim...");

    // Validate the provided certificate details against the local JSON data
    const heir = validateCertificate(certificateId, parentName);
    if (!heir) {
      setMessage("Invalid death certificate or parent information.");
      setLocalLoading(false);
      return;
    }
    transferOwnership(landId, heir)
    .then((tx) => {
      console.log("Transaction sent!", tx);
      console.log("Ownership successfully transferred to:", heir);
      setMessage(`Ownership successfully transferred to ${heir}.`);
    })
    .catch((error) => {
      console.error("Error in transferOwnership:", error);
      setMessage(`Error transferring ownership: ${error.message}`);
    });
      setLocalLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Inheritance Portal</h1>
        
        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.includes("successfully")
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="landId" className="block text-sm font-medium text-gray-700">
                Parent's Land ID
              </label>
              <input
                type="number"
                id="landId"
                name="landId"
                value={landId}
                onChange={(e) => setLandId(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the land record ID"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
                Parent's Name
              </label>
              <input
                type="text"
                id="parentName"
                name="parentName"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the parent's name as on the certificate"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700">
                Death Certificate ID
              </label>
              <input
                type="text"
                id="certificateId"
                name="certificateId"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the death certificate ID"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={localLoading}
              className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                localLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {localLoading ? "Processing..." : "Claim Inheritance"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800">What happens next?</h3>
        <ul className="mt-2 list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Your submitted details will be validated against our records.</li>
          <li>If valid, your inheritance claim will be processed automatically.</li>
          <li>The land record will be updated to reflect the new owner.</li>
          <li>You will receive a confirmation once the process is complete.</li>
        </ul>
      </div>
    </div>
  );
};

export default InheritancePortal;
