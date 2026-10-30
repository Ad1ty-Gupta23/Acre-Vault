import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, ExternalLink, FileText, ShieldCheck, Repeat } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { EXPLORER_URL } from "../config";
import { historyLabel, shortAddress } from "../utils/format";

const eventIcons = {
  registered: <FileText className="h-4 w-4 text-blue-600" />,
  verified: <ShieldCheck className="h-4 w-4 text-green-600" />,
  transferred: <Repeat className="h-4 w-4 text-purple-600" />,
};

const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, lands, landsLoading, error, fetchHistory } = useBlockchain();
  const [history, setHistory] = useState(null); // null while loading
  const [historyError, setHistoryError] = useState(false);

  const land = lands.find((l) => l.id === id);
  const isOwner = account && land?.ownerWallet?.toLowerCase() === account.toLowerCase();

  useEffect(() => {
    setHistory(null);
    setHistoryError(false);
    fetchHistory({ landId: id })
      .then(setHistory)
      .catch((err) => {
        console.error("Error loading land history:", err);
        setHistoryError(true);
        setHistory([]);
      });
  }, [id, fetchHistory]);

  if (!land) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 px-4">
        {landsLoading ? (
          <p className="text-gray-600">Loading land record...</p>
        ) : lands.length === 0 && error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Couldn't reach the registry</h1>
            <p className="mt-2 text-gray-500">The blockchain network isn't responding. Please try again shortly.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Land #{id} not found</h1>
            <p className="mt-2 text-gray-500">No record with this ID exists on the registry.</p>
            <Link to="/lands" className="inline-block mt-6 text-indigo-600 hover:text-indigo-500">
              ← Back to all lands
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Land #{land.id}</p>
            <h1 className="text-2xl font-bold text-gray-900">Survey No. {land.surveyNo}</h1>
          </div>
          {land.isVerified ? (
            <span className="self-start inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
              <Check className="h-4 w-4 mr-1" /> Verified
            </span>
          ) : (
            <span className="self-start inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
              <Clock className="h-4 w-4 mr-1" /> Awaiting verification
            </span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Current owner</dt>
            <dd className="text-lg font-medium text-gray-900">{land.owner}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Owner wallet</dt>
            <dd className="font-mono text-sm text-gray-900 break-all">
              {land.ownerWallet ? (
                <a
                  href={`${EXPLORER_URL}/address/${land.ownerWallet}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                  title={land.ownerWallet}
                >
                  {shortAddress(land.ownerWallet)}
                </a>
              ) : (
                "—"
              )}
              {isOwner && <span className="ml-2 font-sans text-xs text-indigo-600">(you)</span>}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Area</dt>
            <dd className="text-lg font-medium text-gray-900">{land.area} sq.m</dd>
          </div>
        </dl>

        {isOwner && land.isVerified && (
          <button
            onClick={() => navigate("/property_transfer", { state: { selectedLandId: land.id } })}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Transfer this property
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ownership History</h2>
        {history === null ? (
          <p className="text-gray-500">Loading history from the blockchain...</p>
        ) : historyError ? (
          <p className="text-gray-500">Could not load the history for this land right now.</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">No recorded events for this land.</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2">
            {history.map((event) => (
              <li key={`${event.txHash}-${event.logIndex}`} className="mb-6 ml-6 last:mb-0">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full ring-4 ring-white">
                  {eventIcons[event.type]}
                </span>
                <p className="font-medium text-gray-900">{historyLabel(event)}</p>
                <p className="text-sm text-gray-500">
                  {event.timestamp ? new Date(event.timestamp).toLocaleString() : `Block ${event.blockNumber}`}
                  {event.wallet && <> · <span className="font-mono">{shortAddress(event.wallet)}</span></>}
                </p>
                <a
                  href={`${EXPLORER_URL}/tx/${event.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  View transaction <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default LandDetails;
