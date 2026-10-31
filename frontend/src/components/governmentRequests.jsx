import React, { useCallback, useEffect, useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import {
  approveInheritanceClaim,
  approveOfficial,
  getInheritanceClaims,
  getPendingOfficials,
  rejectInheritanceClaim,
} from "../utils/api";
import { ipfsUrl } from "../utils/format";

// Inheritance claims and official sign-ups awaiting a government decision
const GovernmentRequests = () => {
  const { account, isRegistrar, lands, loading, transferOwnership } = useBlockchain();
  const [claims, setClaims] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null); // { type, text }

  const load = useCallback(() => {
    getInheritanceClaims("pending")
      .then((res) => setClaims(res.data))
      .catch(() => setClaims([]));
    getPendingOfficials()
      .then((res) => setOfficials(res.data))
      .catch(() => setOfficials([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id, action, successText) => {
    setBusyId(id);
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", text: successText });
      load();
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setBusyId(null);
    }
  };

  // Transfer on-chain first, then record the transaction against the claim
  const handleApproveClaim = (claim) =>
    run(
      claim._id,
      async () => {
        const receipt = await transferOwnership(claim.landId, claim.heirName, claim.heirWallet, claim.documentCid);
        await approveInheritanceClaim(claim._id, receipt.hash);
      },
      `Land ${claim.landId} transferred to ${claim.heirName}.`
    );

  const handleRejectClaim = (claim) => {
    const note = window.prompt("Reason for rejecting this claim (shown to the claimant):");
    if (note === null) return;
    run(claim._id, () => rejectInheritanceClaim(claim._id, note), `Claim for land ${claim.landId} rejected.`);
  };

  const handleApproveOfficial = (official) =>
    run(official._id, () => approveOfficial(official._id), `${official.name} can now log in.`);

  return (
    <div className="space-y-6">
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

      <section>
        <h2 className="text-xl font-semibold">Inheritance Claims: {claims.length}</h2>
        {account && !isRegistrar && claims.length > 0 && (
          <p className="text-sm text-yellow-700 mt-1">Approving a claim needs a registrar wallet.</p>
        )}
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Land ID</th>
                <th className="border px-4 py-2">Current Owner</th>
                <th className="border px-4 py-2">Deceased</th>
                <th className="border px-4 py-2">Certificate</th>
                <th className="border px-4 py-2">Heir</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length > 0 ? (
                claims.map((claim) => {
                  const land = lands.find((l) => l.id === String(claim.landId));
                  const ownerMatches = land && land.owner.toLowerCase() === claim.parentName.toLowerCase();
                  return (
                    <tr key={claim._id} className="text-center">
                      <td className="border px-4 py-2">{claim.landId}</td>
                      <td className={`border px-4 py-2 ${ownerMatches ? "" : "text-red-600"}`}>
                        {land ? land.owner : "Not found"}
                        {land && !ownerMatches && <span className="block text-xs">Does not match deceased</span>}
                      </td>
                      <td className="border px-4 py-2">{claim.parentName}</td>
                      <td className="border px-4 py-2">
                        {claim.certificateId}
                        {claim.documentCid && (
                          <a
                            href={ipfsUrl(claim.documentCid)}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-xs text-blue-600 underline"
                          >
                            Supporting document
                          </a>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {claim.heirName}
                        <span className="block font-mono text-xs text-gray-500" title={claim.heirWallet}>
                          {claim.heirWallet.substring(0, 6)}...{claim.heirWallet.slice(-4)}
                        </span>
                      </td>
                      <td className="border px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleApproveClaim(claim)}
                          disabled={!account || loading || busyId !== null || !land?.isVerified}
                          title={land && !land.isVerified ? "Land must be verified first" : undefined}
                          className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-green-300 mr-2"
                        >
                          {busyId === claim._id ? "Working..." : "Approve & Transfer"}
                        </button>
                        <button
                          onClick={() => handleRejectClaim(claim)}
                          disabled={busyId !== null}
                          className="px-3 py-1 bg-red-600 text-white rounded disabled:bg-red-300"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="border px-4 py-2 text-center">
                    No pending inheritance claims
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Officials Awaiting Approval: {officials.length}</h2>
        {officials.length > 0 ? (
          <ul className="divide-y border rounded mt-2">
            {officials.map((official) => (
              <li key={official._id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">{official.name}</p>
                  <p className="text-sm text-gray-500">{official.email}</p>
                </div>
                <button
                  onClick={() => handleApproveOfficial(official)}
                  disabled={busyId !== null}
                  className="self-start px-3 py-1 bg-blue-600 text-white rounded disabled:bg-blue-300"
                >
                  {busyId === official._id ? "Approving..." : "Approve"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 mt-2">No accounts waiting for approval.</p>
        )}
      </section>
    </div>
  );
};

export default GovernmentRequests;
