import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/Authcontext';
import api from '../utils/api';

const MyProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties'); // Adjust the endpoint as needed
        const filteredProperties = response.data.filter(property => property.owner === user.id);
        setProperties(filteredProperties);
        
        // If you want to display boundaries on a map, you'll need to add map-related code
        if (filteredProperties.length > 0) {
          // Assuming each property has coordinates in its data
          const boundaries = filteredProperties.map(property => ({
            coordinates: property.coordinates,
            id: property._id,
            name: property.name
          }));
          
          // You might want to set these boundaries in a state variable
          setBoundaries(boundaries);
        }
            } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return <div>Loading properties...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Properties</h1>
      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Property Name</th>
              <th className="py-2">Survey Number</th>
              <th className="py-2">Area</th>
              <th className="py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id}>
                <td className="py-2">{property.name}</td>
                <td className="py-2">{property.surveyNo}</td>
                <td className="py-2">{property.area}</td>
                <td className="py-2">{property.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyProperties;
