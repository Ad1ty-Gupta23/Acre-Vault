import React, { useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";

const LandRegistered = () => {
  const {
    account,
    lands,
    landCount,
    loading,
    connectWallet,
    fetchLands,
  } = useBlockchain();

  useEffect(() => {
    fetchLands();
  }, []);

  return (
    <div className="p-6 max-w-screen mx-auto bg-white rounded-xl shadow-md space-y-4 ">
      <h1 className="text-2xl font-bold">Land Registry</h1>
      <p>
        {account ? `Connected: ${account.substring(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
        </p>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Total Lands: {landCount}</h2>
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
            {lands.length > 0 ? (
              lands.map((land) => (
                <tr key={land.id} className="text-center">
                  <td className="border px-4 py-2">{land.id}</td>
                  <td className="border px-4 py-2">{land.owner}</td>
                  <td className="border px-4 py-2">{land.surveyNo}</td>
                  <td className="border px-4 py-2">{land.area}</td>
                  <td className="border px-4 py-2">{land.isVerified ? "✅" : "❌"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border px-4 py-2 text-center">Fetching from BlockChain</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LandRegistered;
