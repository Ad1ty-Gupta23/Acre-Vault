import React, { useEffect, useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";

const shortAddress = (address) => (address ? `${address.substring(0, 6)}...${address.slice(-4)}` : "—");

const LandRegistered = () => {
  const { account, lands, landCount, landsLoading, fetchLands } = useBlockchain();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  const query = search.trim().toLowerCase();
  const visibleLands = query
    ? lands.filter(
        (land) =>
          land.id === query ||
          land.owner.toLowerCase().includes(query) ||
          land.surveyNo.toLowerCase().includes(query)
      )
    : lands;

  return (
    <div className="p-4 sm:p-6 max-w-screen mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold">Land Registry</h1>
        <p className="text-sm text-gray-500">
          {account ? `Connected: ${shortAddress(account)}` : "Read-only view (no wallet needed)"}
        </p>
      </div>
      <div className="mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl font-semibold">Total Lands: {landCount}</h2>
          <input
            type="search"
            placeholder="Search by ID, owner or survey no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 p-2 border rounded"
            aria-label="Search land records"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Owner</th>
                <th className="border px-4 py-2">Owner Wallet</th>
                <th className="border px-4 py-2">Survey No</th>
                <th className="border px-4 py-2">Area</th>
                <th className="border px-4 py-2">Verified</th>
              </tr>
            </thead>
            <tbody>
              {landsLoading && lands.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border px-4 py-2 text-center">Fetching from blockchain...</td>
                </tr>
              ) : visibleLands.length > 0 ? (
                visibleLands.map((land) => (
                  <tr key={land.id} className="text-center">
                    <td className="border px-4 py-2">{land.id}</td>
                    <td className="border px-4 py-2">{land.owner}</td>
                    <td className="border px-4 py-2 font-mono text-sm" title={land.ownerWallet || ""}>
                      {shortAddress(land.ownerWallet)}
                    </td>
                    <td className="border px-4 py-2">{land.surveyNo}</td>
                    <td className="border px-4 py-2">{land.area}</td>
                    <td className="border px-4 py-2">{land.isVerified ? "✅" : "❌"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border px-4 py-2 text-center">
                    {query ? "No lands match your search" : "No lands registered yet"}
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

export default LandRegistered;
