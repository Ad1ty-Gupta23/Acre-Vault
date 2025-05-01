import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { MessageCircle } from 'lucide-react';
import ChatbotInterface from '../components/chatbot';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="bg-white relative min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Land Registry Platform</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Secure Land Ownership Management
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            A blockchain-based platform for transparent and secure land registry management.
          </p>
          <div className="mt-8 flex justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900">For Landowners</h3>
            <p className="mt-3 text-base text-gray-500">
              Upload and manage your land details securely. Get your property verified by government officials.
            </p>
          </div>
          <div className="mt-12 lg:mt-0">
            <h3 className="text-lg font-medium text-gray-900">For Buyers</h3>
            <p className="mt-3 text-base text-gray-500">
              Search and view verified property records with confidence. Access transparent history of ownership.
            </p>
          </div>
          <div className="mt-12 lg:mt-0">
            <h3 className="text-lg font-medium text-gray-900">For Government Officials</h3>
            <p className="mt-3 text-base text-gray-500">
              Verify and approve property ownership records. Maintain digital registry of all land transactions.
            </p>
          </div>
        </div>
      </div>
      
      {/* Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 animate-bounce"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chatbot Popup */}
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
    </div>
  );
};

export default Home;
