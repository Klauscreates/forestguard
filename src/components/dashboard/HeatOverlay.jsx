import { Circle } from "react-leaflet";

export default function HeatOverlay({ points }) {
  return (
    <>
      {points.map((point) => (
        <Circle
          key={`heat-${point.id}`}
          center={[point.lat, point.lng]}
          radius={Math.max(4500, point.intensity * 18000)}
          pathOptions={{
            color: "#fb7185",
            fillColor: "#fb7185",
            fillOpacity: 0.08 + point.intensity * 0.14,
            weight: 0,
          }}
        />
      ))}
    </>
  );
}
