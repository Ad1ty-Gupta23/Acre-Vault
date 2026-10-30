import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, FileText, MapPin, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { useBlockchain } from "../context/BlockchainContext";
import { getInheritanceClaims, getMyInheritanceClaims, getPendingOfficials } from "../utils/api";
import { historyLabel, timeAgo } from "../utils/format";

const roleContent = {
  landowner: {
    title: "Landowner Dashboard",
    description: "Manage your land records and their verification on the blockchain.",
    actions: [
      "Register land with document checks and map location",
      "Track the verification status of each property",
      "Transfer verified property to a buyer's wallet",
      "See the full on-chain ownership history of any land",
    ],
    primary: { label: "Add New Property", to: "/add_land" },
    secondary: { label: "View My Properties", to: "/my_properties" },
  },
  buyer: {
    title: "Buyer Dashboard",
    description: "Browse verified land records and their complete ownership history.",
    actions: [
      "Search the registry by owner, survey number or land ID",
      "Check that a property is verified before you buy",
      "View the tamper-proof ownership history of any land",
      "Claim inherited land with a death certificate",
    ],
    primary: { label: "Browse Lands", to: "/lands" },
    secondary: { label: "Inheritance Claims", to: "/inherit" },
  },
  government: {
    title: "Government Official Dashboard",
    description: "Verify land records, review inheritance claims and approve new officials.",
    actions: [
      "Verify registered land on the blockchain",
      "Review inheritance claims and transfer land to heirs",
      "Approve new government official accounts",
      "Audit the ownership history of any land",
    ],
    primary: { label: "Verify Records", to: "/verify" },
    secondary: { label: "All Lands", to: "/lands" },
  },
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6 flex items-center">
      <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">{icon}</div>
      <div className="ml-5 w-0 flex-1">
        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
        <dd className="text-2xl font-semibold text-gray-900">{value ?? "—"}</dd>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { account, lands, fetchHistory } = useBlockchain();
  const [claims, setClaims] = useState(null);
  const [pendingOfficials, setPendingOfficials] = useState(null);
  const [activity, setActivity] = useState(null);

  const role = user?.role;
  const content = roleContent[role] || roleContent.buyer;

  // Lands owned by the connected wallet, or recorded under the user's name
  const myLands = lands.filter(
    (land) =>
      (account && land.ownerWallet?.toLowerCase() === account.toLowerCase()) || land.owner === user?.name
  );
  const verifiedCount = lands.filter((land) => land.isVerified).length;

  useEffect(() => {
    if (!role) return;
    if (role === "government") {
      getInheritanceClaims("pending")
        .then((res) => setClaims(res.data))
        .catch(() => setClaims(null));
      getPendingOfficials()
        .then((res) => setPendingOfficials(res.data))
        .catch(() => setPendingOfficials(null));
    } else {
      getMyInheritanceClaims()
        .then((res) => setClaims(res.data))
        .catch(() => setClaims(null));
    }
  }, [role]);

  useEffect(() => {
    fetchHistory()
      .then(setActivity)
      .catch((err) => {
        console.error("Error loading activity:", err);
        setActivity([]);
      });
  }, [fetchHistory]);

  // Landowners see activity on their own land; others see the whole registry
  const myLandIds = new Set(myLands.map((land) => land.id));
  const recentActivity = (activity || [])
    .filter((event) => role !== "landowner" || myLandIds.has(event.landId))
    .slice(-5)
    .reverse();

  const stats =
    role === "government"
      ? [
          { label: "Awaiting Verification", value: lands.length - verifiedCount, icon: <Clock className="h-5 w-5 text-orange-500" /> },
          { label: "Pending Inheritance Claims", value: claims?.length, icon: <FileText className="h-5 w-5 text-purple-500" /> },
          { label: "Officials Awaiting Approval", value: pendingOfficials?.length, icon: <Users className="h-5 w-5 text-blue-500" /> },
        ]
      : role === "landowner"
      ? [
          { label: "Properties Owned", value: myLands.length, icon: <MapPin className="h-5 w-5 text-blue-500" /> },
          { label: "Awaiting Verification", value: myLands.filter((l) => !l.isVerified).length, icon: <Clock className="h-5 w-5 text-orange-500" /> },
          { label: "Verified", value: myLands.filter((l) => l.isVerified).length, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
        ]
      : [
          { label: "Lands in Registry", value: lands.length, icon: <MapPin className="h-5 w-5 text-blue-500" /> },
          { label: "Verified Lands", value: verifiedCount, icon: <ShieldCheck className="h-5 w-5 text-green-500" /> },
          { label: "My Pending Claims", value: claims?.filter((c) => c.status === "pending").length, icon: <FileText className="h-5 w-5 text-purple-500" /> },
        ];

  const verifiedPercent = lands.length ? Math.round((verifiedCount / lands.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{content.title}</h1>
          <p className="mt-2 text-lg text-gray-600">{content.description}</p>
        </div>

        {/* Stats */}
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </dl>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">What you can do</h2>
              <ul className="space-y-3">
                {content.actions.map((action) => (
                  <li key={action} className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(content.primary.to)}
                  className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {content.primary.label}
                </button>
                <button
                  onClick={() => navigate(content.secondary.to)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {content.secondary.label}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
              {activity === null ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {recentActivity.map((event) => (
                    <li key={`${event.txHash}-${event.logIndex}`} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">{historyLabel(event)}</h3>
                        <p className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(event.timestamp)}</p>
                      </div>
                      <Link to={`/lands/${event.landId}`} className="text-sm text-indigo-600 hover:underline">
                        Land #{event.landId}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link to="/lands" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all lands →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Registry overview */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Registry Overview</h2>
            <div className="flex items-baseline justify-between text-sm text-gray-600 mb-2">
              <span>{verifiedCount} of {lands.length} lands verified</span>
              <span className="font-semibold text-gray-900">{verifiedPercent}%</span>
            </div>
            <div
              className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={verifiedPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of lands verified"
            >
              <div className="h-full bg-green-500" style={{ width: `${verifiedPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
