import React, { useEffect } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import PropertyTransfer from "./property_transfer";
import { ArrowRight, Check, X, AlertTriangle, Clock } from "lucide-react"; // Import Clock or another icon

const Properties = () => {
  const { account, lands, landCount, loading, connectWallet, fetchLands } =
    useBlockchain();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  // Filter lands owned by the current user
  const filteredLands = lands.filter((land) => land.owner === user?.name);

  const handleTransferClick = (landId) => {
    navigate("/property_transfer", { state: { selectedLandId: landId } });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <p className="text-sm text-gray-500">
          {account
            ? `Connected: ${account.substring(0, 6)}...${account.slice(-4)}`
            : "Not connected"}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Total Properties: {filteredLands.length}
          </h2>
          <button
            onClick={() => navigate("/add_land")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Property
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area (sq.m)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLands.length > 0 ? (
                  filteredLands.map((land) => (
                    <tr key={land.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {land.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {land.surveyNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {land.area}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {land.isVerified ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <Check className="h-4 w-4 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Clock className="h-4 w-4 mr-1" /> Pending
                          </span>
                        )}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTransferClick(land.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            disabled={!land.isVerified}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Transfer
                          </button>
                          <button
                            onClick={() => navigate(`/property_details/${land.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                        </div>
                        {!land.isVerified && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Verification required before transfer
                          </p>
                        )}
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-lg font-medium text-gray-600 mb-1">No properties found</p>
                        <p className="text-sm text-gray-500 mb-4">You don't own any properties yet</p>
                        <button
                          onClick={() => navigate("/add_land")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Your First Property
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PropertyTransfer />
    </div>
  );
};

export default Properties;