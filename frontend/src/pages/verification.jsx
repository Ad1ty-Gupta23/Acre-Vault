import React, { useEffect, useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";

const Verify = () => {
  const { account, isRegistrar, lands, landsLoading, loading, connectWallet, verifyLand, fetchLands } =
    useBlockchain();

  const [verifyingId, setVerifyingId] = useState(null);
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  // Filter lands to show only those that are not verified
  const unverifiedLands = lands.filter((land) => !land.isVerified);

  const handleVerify = async (landId) => {
    setStatus(null);
    setVerifyingId(landId);
    try {
      await verifyLand(landId);
      setStatus({ type: "success", text: `Land ${landId} verified successfully.` });
    } catch (err) {
      setStatus({ type: "error", text: `Could not verify land ${landId}: ${err.message}` });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-screen mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold">Lands Awaiting Verification</h1>
        {account ? (
          <p className="text-sm text-gray-500">
            Connected: {account.substring(0, 6)}...{account.slice(-4)}
          </p>
        ) : (
          <button onClick={connectWallet} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
            Connect Wallet
          </button>
        )}
      </div>

      {account && !isRegistrar && (
        <div className="p-3 rounded bg-yellow-50 text-yellow-800">
          This wallet is not an authorised registrar, so verification transactions will be rejected. Ask the
          contract admin to grant it the registrar role.
        </div>
      )}

      {status && (
        <div
          role="status"
          className={`p-3 rounded ${
            status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Total Unverified Lands: {unverifiedLands.length}</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Owner</th>
                <th className="border px-4 py-2">Survey No</th>
                <th className="border px-4 py-2">Area</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {landsLoading && lands.length === 0 ? (
                <tr>
                  <td colSpan="5" className="border px-4 py-2 text-center">Loading...</td>
                </tr>
              ) : unverifiedLands.length > 0 ? (
                unverifiedLands.map((land) => (
                  <tr key={land.id} className="text-center">
                    <td className="border px-4 py-2">{land.id}</td>
                    <td className="border px-4 py-2">{land.owner}</td>
                    <td className="border px-4 py-2">{land.surveyNo}</td>
                    <td className="border px-4 py-2">{land.area}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleVerify(land.id)}
                        disabled={!account || loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-blue-300"
                      >
                        {verifyingId === land.id ? "Verifying..." : "Verify"}
                      </button>
                    </td>
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
    </div>
  );
};

export default Verify;
