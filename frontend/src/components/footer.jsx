import React from "react";
import { Link } from "react-router-dom";
import { CONTRACT_ADDRESS, EXPLORER_URL } from "../config";
import { shortAddress } from "../utils/format";

const Footer = () => (
  <footer className="bg-gray-800 text-gray-400 text-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-white font-semibold">AcreVault</p>
        <p className="mt-1">Blockchain-based land registry management.</p>
      </div>
      <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
        <Link to="/lands" className="hover:text-white">All Lands</Link>
        <Link to="/register" className="hover:text-white">Sign Up</Link>
        <a
          href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white"
          title={CONTRACT_ADDRESS}
        >
          Contract {shortAddress(CONTRACT_ADDRESS)}
        </a>
      </nav>
    </div>
  </footer>
);

export default Footer;
