import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LandGISMap = ({ coordinates }) => {
  // Convert coordinates string to array of lat-lng pairs
  const parseCoordinates = (coords) => {
    if (!coords) return [];
    return coords.split(',').map(coord => parseFloat(coord.trim()));
  };

  // Example land boundary coordinates (Latitude, Longitude)
  const landBoundary = [
    parseCoordinates(coordinates),
    [parseCoordinates(coordinates)[0] + 0.004, parseCoordinates(coordinates)[1] + 0.004],
    [parseCoordinates(coordinates)[0] + 0.004, parseCoordinates(coordinates)[1] - 0.004],
    parseCoordinates(coordinates), // Closing the polygon
  ];

  // Example marker (land location)
  const landLocation = parseCoordinates(coordinates);

  return (
    <MapContainer center={landLocation} zoom={15} style={{ height: "500px", width: "100%" }}>
      {/* OpenStreetMap Tile Layer */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Land Marker */}
      <Marker position={landLocation}>
        <Popup>Land Location</Popup>
      </Marker>

      {/* Land Boundary Polygon */}
      <Polygon positions={landBoundary} color="blue">
        <Popup>Land Boundary Area</Popup>
      </Polygon>
    </MapContainer>
  );
};

export default LandGISMap;