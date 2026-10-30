import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/Authcontext";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Login from "./pages/login";
import Signup from "./pages/signin";
import Dashboard from "./pages/dashboard"; // You'll need to create this
import Home from "./pages/homepage"; // You'll need to create this
import ChatbotInterface from "./components/chatbot";
import AddLand from "./pages/add_land";
import InheritancePortal from "./pages/InheritancePortal";
import { BlockchainProvider } from "./context/BlockchainContext";
import { ToastContainer } from "react-toastify";
import LandGISMap from './pages/land_map'; // You'll need to create this
import Properties from "./pages/properties";
import LandRegistered from "./pages/landRegistered";
import LandDetails from "./pages/landDetails";
import PropertyTransfer from "./pages/property_transfer";
import Verify from "./pages/verification";


// Protected route component; pass `roles` to limit it to certain user roles
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const NotFound = () => (
  <div className="max-w-xl mx-auto text-center py-24 px-4">
    <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
    <p className="mt-3 text-gray-500">This page doesn't exist yet.</p>
    <Link to="/" className="inline-block mt-6 px-5 py-3 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
      Back to home
    </Link>
  </div>
);

const App = () => {
  return (
    <BlockchainProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <ToastContainer position="top-right" autoClose={5000} newestOnTop />
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/chatbot" element={<ChatbotInterface />} />
                <Route path="/add_land" element={<ProtectedRoute roles={["landowner"]}><AddLand /></ProtectedRoute>} />
                <Route path="/inherit" element={<ProtectedRoute><InheritancePortal /></ProtectedRoute>} />
                <Route path="/land_map" element={<LandGISMap />} />
                <Route path="/my_properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
                <Route path="/lands" element={<LandRegistered />} />
                <Route path="/lands/:id" element={<LandDetails />} />
                <Route path="/property_transfer" element={<ProtectedRoute><PropertyTransfer /></ProtectedRoute>} />
                <Route path="/verify" element={<ProtectedRoute roles={["government"]}><Verify /></ProtectedRoute>} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </BlockchainProvider>
  );
};

export default App;
