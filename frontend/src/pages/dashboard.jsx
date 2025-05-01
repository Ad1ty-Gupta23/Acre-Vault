import React, { useEffect, useState } from "react";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChatbotInterface from '../components/chatbot';


const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  const [chartTimeframe, setChartTimeframe] = useState("monthly");

  // Sample data for the chart
  const monthlyData = [
    { name: "Jan", price: 42000, transactions: 18 },
    { name: "Feb", price: 42800, transactions: 22 },
    { name: "Mar", price: 43200, transactions: 19 },
    { name: "Apr", price: 42700, transactions: 23 },
    { name: "May", price: 43900, transactions: 25 },
    { name: "Jun", price: 44500, transactions: 21 },
    { name: "Jul", price: 44100, transactions: 20 },
    { name: "Aug", price: 44800, transactions: 24 },
    { name: "Sep", price: 45000, transactions: 28 },
  ];

  const quarterlyData = [
    { name: "Q1 2023", price: 41000, transactions: 54 },
    { name: "Q2 2023", price: 42500, transactions: 62 },
    { name: "Q3 2023", price: 43800, transactions: 71 },
    { name: "Q4 2023", price: 44200, transactions: 68 },
    { name: "Q1 2024", price: 44800, transactions: 76 },
    { name: "Q2 2024", price: 45700, transactions: 82 },
  ];

  const yearlyData = [
    { name: "2019", price: 38000, transactions: 187 },
    { name: "2020", price: 39500, transactions: 162 },
    { name: "2021", price: 40900, transactions: 201 },
    { name: "2022", price: 42700, transactions: 245 },
    { name: "2023", price: 44600, transactions: 278 },
  ];

  // Get chart data based on selected timeframe
  const chartData =
    chartTimeframe === "quarterly"
      ? quarterlyData
      : chartTimeframe === "yearly"
      ? yearlyData
      : monthlyData;

  useEffect(() => {
    if (user) {
      // Set mock statistics based on user role
      const mockStats = {
        landowner: [
          {
            label: "Properties Owned",
            value: 3,
            icon: <MapPin className="h-5 w-5 text-blue-500" />,
          },
          {
            label: "Pending Verifications",
            value: 1,
            icon: <Clock className="h-5 w-5 text-orange-500" />,
          },
          {
            label: "Transfer Requests",
            value: 2,
            icon: <Users className="h-5 w-5 text-purple-500" />,
          },
        ],
        buyer: [
          {
            label: "Saved Properties",
            value: 5,
            icon: <MapPin className="h-5 w-5 text-blue-500" />,
          },
          {
            label: "Purchase Requests",
            value: 2,
            icon: <FileText className="h-5 w-5 text-green-500" />,
          },
          {
            label: "New Listings",
            value: 12,
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          },
        ],
        government: [
          {
            label: "Pending Verifications",
            value: 8,
            icon: <FileText className="h-5 w-5 text-orange-500" />,
          },
          {
            label: "Transfer Requests",
            value: 5,
            icon: <Users className="h-5 w-5 text-purple-500" />,
          },
          {
            label: "Fraud Alerts",
            value: 2,
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          },
        ],
        default: [
          {
            label: "Properties Viewed",
            value: 7,
            icon: <MapPin className="h-5 w-5 text-blue-500" />,
          },
          {
            label: "Saved Searches",
            value: 3,
            icon: <FileText className="h-5 w-5 text-green-500" />,
          },
        ],
      };

      // Set mock recent activity based on user role
      const mockActivity = {
        landowner: [
          {
            action: "Property verification completed",
            property: "Plot #1234",
            time: "2 hours ago",
          },
          {
            action: "Transfer request received",
            property: "Farmland #5678",
            time: "1 day ago",
          },
          {
            action: "Property boundary updated",
            property: "Residential Plot #9101",
            time: "3 days ago",
          },
        ],
        buyer: [
          {
            action: "New property matched your search",
            property: "Commercial #2468",
            time: "3 hours ago",
          },
          {
            action: "Ownership history viewed",
            property: "Apartment #1357",
            time: "1 day ago",
          },
          {
            action: "Purchase request submitted",
            property: "Villa #7890",
            time: "5 days ago",
          },
        ],
        government: [
          {
            action: "New verification request",
            property: "Industrial Plot #4321",
            time: "1 hour ago",
          },
          {
            action: "Transfer approval pending",
            property: "Agricultural Land #8765",
            time: "5 hours ago",
          },
          {
            action: "Fraud alert triggered",
            property: "Commercial Building #1019",
            time: "2 days ago",
          },
        ],
        default: [
          { action: "Profile updated", property: "", time: "1 day ago" },
          { action: "Account created", property: "", time: "7 days ago" },
        ],
      };

      setStats(mockStats[user.role] || mockStats.default);
      setRecentActivity(mockActivity[user.role] || mockActivity.default);

      switch (user.role) {
        case "landowner":
          setContent({
            title: "Landowner Dashboard",
            description:
              "Manage your land properties and ownership records securely on the blockchain.",
            actions: [
              "Upload new land details with geospatial mapping",
              "View your properties and blockchain verification status",
              "Track verification status and receive real-time updates",
              "Manage ownership transfer requests with secure smart contracts",
              "Generate legal ownership certificates",
            ],
            buttonLabel: "Add New Property",
            buttonAction: () => navigate("/add_land"),
            secondaryButton: {
              label: "View My Properties",
              action: () => navigate("/my_properties"),
            },
          });
          break;
        case "buyer":
          setContent({
            title: "Buyer Dashboard",
            description:
              "Search and view verified property records with complete ownership history.",
            actions: [
              "Search land records with advanced filtering options",
              "View property details with blockchain-verified ownership",
              "Track ownership history with tamper-proof records",
              "Initiate purchase requests using secure smart contracts",
              "Set alerts for properties matching your criteria",
            ],
            buttonLabel: "Find Properties",
            buttonAction: () => navigate("/find_properties"),
            secondaryButton: {
              label: "My Purchase Requests",
              action: () => navigate("/purchase_requests"),
            },
          });
          break;
        case "government":
          setContent({
            title: "Government Official Dashboard",
            description:
              "Verify and approve ownership records with AI-powered fraud detection.",
            actions: [
              "Verify submitted land records with document authentication",
              "Approve ownership transfers with multi-level security checks",
              "Manage land registry database with audit trail",
              "Generate verification reports and analytics",
              "Review AI-detected fraud alerts",
            ],
            buttonLabel: "Verify Records",
            buttonAction: () => navigate("/verify"),
            secondaryButton: {
              label: "Fraud Reports",
              action: () => navigate("/verify"),
            },
          });
          break;
        default:
          setContent({
            title: "User Dashboard",
            description:
              "Welcome to your blockchain-based land registry dashboard.",
            actions: [
              "View profile information",
              "Update account settings and security preferences",
              "Set up notification preferences",
              "Explore available features",
            ],
            buttonLabel: "Edit Profile",
            buttonAction: () => navigate("/edit_profile"),
            secondaryButton: {
              label: "Browse Properties",
              action: () => navigate("/browse"),
            },
          });
      }
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg font-medium text-gray-700">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        {isChatOpen && (
        <div className="fixed bottom-20 right-6 bg-white w-96 h-[500px] shadow-lg rounded-lg border p-4 z-50 animate-fade-in">
          <ChatbotInterface />
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            onClick={() => setIsChatOpen(false)}
          >
            ✖
          </button>
        </div>
      )}
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Session Expired
          </h2>
          <p className="mb-6 text-gray-600">
            Your session has expired or you are not logged in.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {content.title}
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/notifications")}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  ></path>
                </svg>
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-2 text-lg text-gray-600">{content.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats &&
            stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                      {stat.icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.label}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Features section */}
          <div className="lg:col-span-2 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Features & Capabilities
              </h2>
              <ul className="space-y-3">
                {content.actions.map((action, index) => (
                  <li key={index} className="flex">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={content.buttonAction}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {content.buttonLabel}
                </button>
                {content.secondaryButton && (
                  <button
                    onClick={content.secondaryButton.action}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {content.secondaryButton.label}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {recentActivity.map((activity, index) => (
                    <li key={index} className="py-3">
                      <div className="flex space-x-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">
                              {activity.action}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {activity.time}
                            </p>
                          </div>
                          {activity.property && (
                            <p className="text-sm text-gray-500">
                              {activity.property}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <a
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all activity →
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Trends Section - For buyers and landowners */}
        {(user?.role === "buyer" || user?.role === "landowner") && (
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Market Trends
                </h2>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                    onClick={() => setChartTimeframe("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full"
                    onClick={() => setChartTimeframe("quarterly")}
                  >
                    Quarterly
                  </button>
                  <button
                    className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full"
                    onClick={() => setChartTimeframe("yearly")}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                {/* Use LineChart from recharts */}
                <LineChart
                  width={800}
                  height={250}
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "price") return `₹${value.toLocaleString()}`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    name="Avg. Price/Acre"
                    stroke="#4F46E5"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="transactions"
                    name="Transactions"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </LineChart>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Avg. Price/Acre</p>
                  <p className="text-lg font-semibold text-gray-900">₹45,000</p>
                  <p className="text-xs text-green-600">
                    ↑ 5.2% from last month
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg font-semibold text-gray-900">28</p>
                  <p className="text-xs text-blue-600">↑ 12% from last month</p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-xs text-gray-500">
                    Avg. Verification Time
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    3.2 days
                  </p>
                  <p className="text-xs text-green-600">
                    ↓ 15% from last month
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
     
    </div>
  );
};

export default Dashboard;
