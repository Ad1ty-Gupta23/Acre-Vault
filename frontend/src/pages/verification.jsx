import React, { useEffect, useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";

const Verify = () => {
  const {
    account,
    lands,
    landCount,
    loading,
    connectWallet,
    verifyLand,
    fetchLands,
  } = useBlockchain();

  useEffect(() => {
    fetchLands();
  }, []);

  // Filter lands to show only those that are not verified
  const unverifiedLands = lands.filter((land) => !land.isVerified);
  const [verifyId, setVerifyId] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");

  const handleVerify = async () => {
    if (!verifyId) {
      alert("Please enter a Land ID to verify.");
      return;
    }
    try {
      setVerifyStatus("Verifying land...");
      await verifyLand(verifyId);
      setVerifyStatus("Land verified successfully!");
      setVerifyId("");
      
      // Reload the page after successful verification
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (err) {
      setVerifyStatus("Error verifying land");
    }
  };
  

  return (
    <div className="p-6 max-w-screen mx-auto bg-white rounded-xl shadow-md space-y-4 ">
      <h1 className="text-2xl font-bold">Yet To Be VERIFY</h1>
      <p>
        {account
          ? `Connected: ${account.substring(0, 6)}...${account.slice(-4)}`
          : "Connect Wallet"}
      </p>
      <div className="max-w-lg mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Verify Land</h1>

        {verifyStatus && (
          <div
            className={`mb-4 p-3 rounded ${
              verifyStatus.includes("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {verifyStatus}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Land ID</span>
            <input
              type="text"
              placeholder="Enter Land ID"
              value={verifyId}
              onChange={(e) => setVerifyId(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              disabled={loading}
            />
          </label>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-400 transition"
          >
            {loading ? "Verifying..." : "Verify Land"}
          </button>
        </div>
      </div>

      <hr />
      <div className="mt-4">
        <h2 className="text-xl font-semibold">
          Total Unverified Lands: {unverifiedLands.length}
        </h2>
        {loading && <p>Loading...</p>}
        <table className="table-auto w-full border-collapse border border-gray-300 mt-2">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Owner</th>
              <th className="border px-4 py-2">Survey No</th>
              <th className="border px-4 py-2">Area</th>
              <th className="border px-4 py-2">Verified</th>
            </tr>
          </thead>
          <tbody>
            {unverifiedLands.length > 0 ? (
              unverifiedLands.map((land) => (
                <tr key={land.id} className="text-center">
                  <td className="border px-4 py-2">{land.id}</td>
                  <td className="border px-4 py-2">{land.owner}</td>
                  <td className="border px-4 py-2">{land.surveyNo}</td>
                  <td className="border px-4 py-2">{land.area}</td>
                  <td className="border px-4 py-2">❌</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border px-4 py-2 text-center">
                  No unverified lands found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Verify;
