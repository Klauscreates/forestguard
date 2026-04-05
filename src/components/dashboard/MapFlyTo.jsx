import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapFlyTo({ lat, lng, zoom = 10 }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }, [lat, lng, zoom, map]);

  return null;
}