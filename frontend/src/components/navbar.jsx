import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { useBlockchain } from "../context/BlockchainContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { connectWallet, account } = useBlockchain();

  const handleLogout = () => {
    logout();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "landowner":
        return "Landowner";
      case "buyer":
        return "Buyer";
      case "government":
        return "Government Official";
      default:
        return "User";
    }
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-">
              <Link to="/" className="text-white font-bold text-xl">
                AcreVault
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {!isAuthenticated && (
                  <Link
                    to="/"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Home
                  </Link>
                )}
                {isAuthenticated && user?.role !== "government" && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/inherit"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Inheritance
                    </Link>
                    <Link
                      to="/lands"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      All-Lands
                    </Link>
                  </>
                )}
                {isAuthenticated && user?.role == "government" && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/verify"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Verify
                    </Link>
                    <Link
                      to="/lands"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      All-Lands
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="ml-3 relative">
            {isAuthenticated ? (
              <div className="flex items-center">
                <div className="text-gray-300 mr-4">
                  {user?.name && `Welcome, ${user.name}`}
                  {user?.role && (
                    <span className="ml-2 text-xs bg-gray-700 py-1 px-2 rounded">
                      {getRoleLabel(user.role)}
                    </span>
                  )}
                </div>
                <button
                  onClick={connectWallet}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  {account ? `Connected` : "Connect Wallet"}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex">
                <Link
                  to="/login"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white ml-2 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;