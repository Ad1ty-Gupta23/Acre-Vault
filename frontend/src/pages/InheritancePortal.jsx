import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useBlockchain } from "../context/BlockchainContext";
import { getMyInheritanceClaims, submitInheritanceClaim, uploadDocument } from "../utils/api";
import { explorerUrl, ipfsUrl } from "../utils/format";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const InheritancePortal = () => {
  const [landId, setLandId] = useState("");
  const [parentName, setParentName] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [heirWallet, setHeirWallet] = useState("");
  const [heirDocument, setHeirDocument] = useState(null);
  const [message, setMessage] = useState(null); // { type, text }
  const [submitting, setSubmitting] = useState(false);
  const [claims, setClaims] = useState([]);
  const navigate = useNavigate();

  const { account, connectWallet } = useBlockchain();

  // Default the receiving wallet to the connected one
  useEffect(() => {
    if (account && !heirWallet) setHeirWallet(account);
  }, [account]);

  const loadClaims = () =>
    getMyInheritanceClaims()
      .then((res) => setClaims(res.data))
      .catch(() => setClaims([]));

  useEffect(() => {
    loadClaims();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!landId || !parentName || !certificateId || !heirWallet || !heirDocument) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }
    if (!ethers.isAddress(heirWallet.trim())) {
      setMessage({ type: "error", text: "The wallet address is not a valid Ethereum address." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const documentCid = await uploadDocument(heirDocument, "heir-document");
      await submitInheritanceClaim({
        landId: Number(landId),
        parentName,
        certificateId,
        heirWallet: heirWallet.trim(),
        documentCid,
      });
      setMessage({
        type: "success",
        text: "Claim submitted. A government official will review it and transfer the land to your wallet.",
      });
      setLandId("");
      setParentName("");
      setCertificateId("");
      setHeirDocument(null);
      e.target.reset();
      loadClaims();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Could not submit the claim." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Inheritance Portal</h1>

        {message && (
          <div
            role="status"
            className={`mb-4 p-3 rounded border ${
              message.type === "success"
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="landId" className="block text-sm font-medium text-gray-700">
              Parent's Land ID
            </label>
            <input
              type="number"
              min="1"
              id="landId"
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter the land record ID"
            />
          </div>

          <div>
            <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
              Parent's Name
            </label>
            <input
              type="text"
              id="parentName"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter the parent's name as on the certificate"
            />
          </div>

          <div>
            <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700">
              Death Certificate ID
            </label>
            <input
              type="text"
              id="certificateId"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter the death certificate ID"
            />
          </div>

          <div>
            <label htmlFor="heirWallet" className="block text-sm font-medium text-gray-700">
              Your Wallet Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                id="heirWallet"
                value={heirWallet}
                onChange={(e) => setHeirWallet(e.target.value)}
                required
                className={`${inputClass} font-mono text-sm`}
                placeholder="0x..."
              />
              {!account && (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm whitespace-nowrap hover:bg-gray-50"
                >
                  Use connected wallet
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">The land will be transferred to this wallet.</p>
          </div>

          <div>
            <label htmlFor="heirDocument" className="block text-sm font-medium text-gray-700">
              Supporting Document
            </label>
            <input
              type="file"
              id="heirDocument"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setHeirDocument(e.target.files[0] || null)}
              required
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              E.g. a legal heir or succession certificate. Stored on IPFS (public) and becomes the land's
              document if the claim is approved.
            </p>
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
              type="submit"
              disabled={submitting}
              className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                submitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800">What happens next?</h3>
        <ul className="mt-2 list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Your certificate details are checked against the death-certificate registry.</li>
          <li>Only the heir named on the certificate can submit the claim.</li>
          <li>A government official reviews the claim and transfers the land on the blockchain.</li>
          <li>The claim status below updates once it has been reviewed.</li>
        </ul>
      </div>

      {claims.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Claims</h2>
          <ul className="divide-y">
            {claims.map((claim) => (
              <li key={claim._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">
                    Land #{claim.landId} from {claim.parentName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Certificate {claim.certificateId} · submitted {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                  {claim.reviewNote && <p className="text-sm text-gray-600">Note: {claim.reviewNote}</p>}
                  {claim.documentCid && (
                    <a
                      href={ipfsUrl(claim.documentCid)}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 text-sm text-blue-600 underline"
                    >
                      Supporting document
                    </a>
                  )}
                  {claim.txHash && explorerUrl("tx", claim.txHash) && (
                    <a
                      href={explorerUrl("tx", claim.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      View transfer transaction
                    </a>
                  )}
                </div>
                <span className={`self-start px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[claim.status]}`}>
                  {claim.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InheritancePortal;
