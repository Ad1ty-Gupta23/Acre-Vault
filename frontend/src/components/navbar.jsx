import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { useBlockchain } from "../context/BlockchainContext";

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

const getLinks = (isAuthenticated, role) => {
  if (!isAuthenticated) {
    return [
      { to: "/", label: "Home" },
      { to: "/lands", label: "All Lands" },
    ];
  }
  if (role === "government") {
    return [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/verify", label: "Verify" },
      { to: "/lands", label: "All Lands" },
    ];
  }
  return [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/my_properties", label: "My Properties" },
    { to: "/inherit", label: "Inheritance" },
    { to: "/lands", label: "All Lands" },
  ];
};

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
  }`;

const buttonClass = "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium text-left";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { connectWallet, account } = useBlockchain();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = getLinks(isAuthenticated, user?.role);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const walletLabel = account ? `${account.substring(0, 6)}...${account.slice(-4)}` : "Connect Wallet";

  const accountActions = isAuthenticated ? (
    <>
      <button onClick={connectWallet} className={buttonClass} title={account || undefined}>
        {walletLabel}
      </button>
      <button onClick={handleLogout} className={buttonClass}>
        Logout
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={linkClass} onClick={closeMenu}>
        Login
      </NavLink>
      <NavLink to="/register" className={linkClass} onClick={closeMenu}>
        Sign Up
      </NavLink>
    </>
  );

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl" onClick={closeMenu}>
              AcreVault
            </Link>
            <div className="hidden md:flex md:ml-6 space-x-2">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated && (
              <div className="text-gray-300 mr-2 text-sm">
                {user?.name && `Welcome, ${user.name}`}
                {user?.role && (
                  <span className="ml-2 text-xs bg-gray-700 py-1 px-2 rounded">{getRoleLabel(user.role)}</span>
                )}
              </div>
            )}
            {accountActions}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-700 px-4 pt-2 pb-3 space-y-1">
          {isAuthenticated && (
            <div className="px-3 py-2 text-gray-300 text-sm">
              {user?.name}
              {user?.role && (
                <span className="ml-2 text-xs bg-gray-700 py-1 px-2 rounded">{getRoleLabel(user.role)}</span>
              )}
            </div>
          )}
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end className={linkClass} onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}
          <div className="flex flex-col pt-2 border-t border-gray-700">{accountActions}</div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
