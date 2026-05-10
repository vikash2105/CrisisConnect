"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import defaultIcon from "@/components/mapIcon";

// Handles map clicks and drops a marker
function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : <Marker position={position} icon={defaultIcon} />;
}

// Recenter map when an external position is provided
function RecenterOnPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView({ lat: position[0], lng: position[1] });
    }
  }, [position, map]);
  return null;
}

export default function LocationSelectorMap({
  onLocationSelect,
  initialPosition = [28.5355, 77.3910],
  position = null,
}) {
  const [mapCenter, setMapCenter] = useState(initialPosition);

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMapCenter([latitude, longitude]);
        },
        () => {
          // Use default position if geolocation fails
          setMapCenter(initialPosition);
        }
      );
    }
  }, [initialPosition]);

  const handleLocationSelect = async (lat, lng) => {
    // Reverse geocode to get address using Nominatim (OpenStreetMap)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "CrisisConnect App",
          },
        }
      );
      const data = await response.json();

      if (data.display_name) {
        onLocationSelect(lat, lng, data.display_name);
      } else {
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Error getting address:", error);
      onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={position ?? mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onLocationSelect={handleLocationSelect} />
        <RecenterOnPosition position={position ?? null} />
        {position && <Marker position={position} icon={defaultIcon} />}
      </MapContainer>
    </div>
  );
}
