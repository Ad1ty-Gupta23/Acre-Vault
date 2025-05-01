import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/Authcontext";
import Navbar from "./components/navbar";
import Login from "./pages/login";
import Signup from "./pages/signin";
import Dashboard from "./pages/dashboard"; // You'll need to create this
import Home from "./pages/homepage"; // You'll need to create this
import ChatbotInterface from "./components/chatbot";
import AddLand from "./pages/add_land";
import InheritancePortal from "./pages/InheritancePortal";
import { BlockchainProvider } from "./context/BlockchainContext";
import AddProperties from './pages/my_properties';
import LandGISMap from './pages/land_map'; // You'll need to create this
import Properties from "./pages/properties";
import LandRegistered from "./pages/landRegistered";
import PropertyTransfer from "./pages/property_transfer";
import Verify from "./pages/verification";


// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <BlockchainProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/chatbot" element={<ChatbotInterface />} />
                <Route path="/add_land" element={<AddLand />} />
                <Route path="/inherit" element={<InheritancePortal />} />
                <Route path="/land_map" element={<LandGISMap />} />
                <Route path="/my_properties" element={<Properties />} />
                <Route path="/lands" element={<LandRegistered/>} />
                <Route path="/property_transfer" element={<PropertyTransfer />} />
                <Route path="/verify" element={<Verify />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
              {/* {  <Route path="/my_propertiess" element={<AddProperties />} /> */}
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </BlockchainProvider>
  );
};

export default App;
