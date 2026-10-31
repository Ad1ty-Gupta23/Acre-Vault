import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import { useBlockchain } from '../context/BlockchainContext';
import { FileSearch, FileText, MessageCircle, Repeat, Search, ShieldCheck, Users } from 'lucide-react';
import ChatbotInterface from '../components/chatbot';

const steps = [
  {
    icon: <FileText className="h-6 w-6 text-indigo-600" />,
    title: 'Register',
    text: 'Landowners submit land details and the sale deed. The document is checked for signs of fraud before anything is recorded.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-indigo-600" />,
    title: 'Verify',
    text: 'An authorised government registrar reviews the record and verifies it on the blockchain.',
  },
  {
    icon: <Repeat className="h-6 w-6 text-indigo-600" />,
    title: 'Transfer',
    text: "Only the owner's wallet can transfer verified land. Inheritance claims are approved by an official.",
  },
  {
    icon: <FileSearch className="h-6 w-6 text-indigo-600" />,
    title: 'Audit',
    text: 'Anyone can look up a land record and its full ownership history. No account needed.',
  },
];

const audiences = [
  {
    title: 'For Landowners',
    text: 'Register your land, track its verification and transfer it securely to a buyer.',
  },
  {
    title: 'For Buyers',
    text: 'Check that a property is verified and see who has owned it before you buy.',
  },
  {
    title: 'For Government Officials',
    text: 'Verify records, review inheritance claims and keep a tamper-proof registry.',
  },
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { landCount, lands } = useBlockchain();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lookupId, setLookupId] = useState('');

  const verifiedCount = lands.filter((land) => land.isVerified).length;

  const handleLookup = (e) => {
    e.preventDefault();
    const id = lookupId.trim();
    if (id) navigate(`/lands/${id}`);
  };

  return (
    <div className="bg-white relative">
      {/* Hero */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8 text-center">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Land Registry Platform</h2>
        <h1 className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Secure Land Ownership Management
        </h1>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
          A blockchain-based platform for transparent and secure land registry management.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-3 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-5 py-3 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Public lookup */}
        <form onSubmit={handleLookup} className="mt-12 max-w-md mx-auto flex gap-2">
          <label htmlFor="lookup" className="sr-only">
            Land ID
          </label>
          <input
            id="lookup"
            type="number"
            min="1"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Look up a land record by ID"
            className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-3 rounded-md text-white bg-gray-900 hover:bg-gray-700"
          >
            <Search className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Look up</span>
          </button>
        </form>
        <p className="mt-3 text-sm text-gray-500">
          {landCount > 0 ? `${landCount} ${landCount === 1 ? 'land' : 'lands'} on the registry, ${verifiedCount} verified. ` : ''}
          <Link to="/lands" className="text-indigo-600 hover:text-indigo-500">
            Browse all lands →
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">How it works</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50">{step.icon}</span>
                  <span className="text-sm font-semibold text-gray-400">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{step.title}</h3>
                <p className="mt-2 text-base text-gray-500">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Audiences */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
          {audiences.map((audience) => (
            <div key={audience.title} className="flex gap-4">
              <Users className="h-6 w-6 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{audience.title}</h3>
                <p className="mt-2 text-base text-gray-500">{audience.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chatbot Popup */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 bg-white w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[75vh] shadow-lg rounded-lg border p-4 z-50 animate-fade-in">
          <ChatbotInterface />
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            aria-label="Close assistant"
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
