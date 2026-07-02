import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Geolocation } from "@capacitor/geolocation";

// Fix for default marker icon in Leaflet + Webpack/Vite
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapInteraction({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng);
    },
  });
  return null;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ onConfirm }) {
  // Default CDMX center
  const [position, setPosition] = useState({ lat: 19.4326, lng: -99.1332 });
  const [address, setAddress] = useState("Cargando ubicación...");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAddress = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Ubicación desconocida");
      }
    } catch (e) {
      setAddress("No se pudo obtener la dirección");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelected = (latlng) => {
    setPosition(latlng);
    fetchAddress(latlng.lat, latlng.lng);
  };

  const getUserLocation = async () => {
    try {
      setLoading(true);
      const permResult = await Geolocation.requestPermissions();
      
      if (permResult.location === 'denied') {
        throw new Error('Location permission denied');
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      const { latitude, longitude } = pos.coords;
      setPosition({ lat: latitude, lng: longitude });
      fetchAddress(latitude, longitude);
    } catch (err) {
      console.warn("Geolocation error:", err);
      // Fallback to default position
      fetchAddress(position.lat, position.lng);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      <div style={styles.mapWrapper}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={styles.map}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={[position.lat, position.lng]} />
          <MapInteraction onLocationSelected={handleLocationSelected} />
          <Marker position={[position.lat, position.lng]} />
        </MapContainer>
      </div>

      <div style={styles.infoCard}>
        <p style={styles.addressText}>
          {loading ? "Obteniendo dirección..." : address}
        </p>
        <input
          type="text"
          placeholder="Núm. Exterior, Interior, Depto (Opcional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          style={styles.detailsInput}
        />
        <div style={styles.actionsRow}>
          <button
            style={styles.locationBtn}
            onClick={getUserLocation}
            disabled={loading}
            title="Usar mi ubicación actual"
          >
            📍
          </button>
          <button
            style={styles.confirmBtn}
            onClick={() => {
              const finalAddress = details ? `${address}, ${details}` : address;
              onConfirm({ lat: position.lat, lng: position.lng, address: finalAddress });
            }}
            disabled={loading}
          >
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#0B0B0C",
    borderRadius: "16px",
    overflow: "hidden",
  },
  mapWrapper: {
    height: "250px",
    width: "100%",
    backgroundColor: "#131316",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #222227",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  infoCard: {
    backgroundColor: "#131316",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #222227",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  addressText: {
    fontSize: "13px",
    color: "#E2E8F0",
    margin: 0,
    lineHeight: "1.4",
  },
  detailsInput: {
    backgroundColor: "#1C1C22",
    border: "1px solid #333336",
    color: "#F8FAFC",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  actionsRow: {
    display: "flex",
    gap: "8px",
  },
  locationBtn: {
    backgroundColor: "#222227",
    color: "#fff",
    border: "1px solid #333336",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  },
  confirmBtn: {
    backgroundColor: "#F97316",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "opacity 0.2s",
    flex: 1,
  },
};
