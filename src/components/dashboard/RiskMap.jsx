import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import apaBoundary from "../../data/apa-triunfo-do-xingu-boundary.json";
import MapFlyTo from "./MapFlyTo";

function formatGeneratedAt(value) {
  if (!value) return "Awaiting refresh";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RiskMap({
  selectedAlertId,
  onSelectAlert,
  alerts = [],
  generatedAt,
  sources = [],
  mode,
  isLoading,
}) {
  const selectedSpot = selectedAlertId ? alerts.find((alert) => alert.id === selectedAlertId) : null;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#091424] text-white">
      <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-white/10 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-200" />
            <h3 className="text-xs font-semibold text-white">Amazon deforestation watch</h3>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Basemap + live DETER public alerts + protected-area boundary.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm border border-emerald-300/60 bg-emerald-300/10" />
            <span className="text-[10px] text-slate-400">Protected area</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-400">DETER alert</span>
          </div>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={[-6.6448, -51.9951]}
          zoom={8}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {/* Fly to selected alert */}
          {selectedSpot && (
            <MapFlyTo lat={selectedSpot.lat} lng={selectedSpot.lng} zoom={10} />
          )}

          <Polygon
            positions={apaBoundary}
            pathOptions={{ color: "#4ade80", fillOpacity: 0, weight: 2.2, dashArray: "7 4" }}
          />

          {alerts.map((spot) => {
            const isSelected = selectedAlertId === spot.id;
            return (
              <CircleMarker
                key={spot.id}
                center={[spot.lat, spot.lng]}
                radius={isSelected ? 8 : 5}
                pathOptions={{
                  color: isSelected ? "#ffffff" : "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: isSelected ? 0.9 : 0.75,
                  weight: isSelected ? 2.5 : 1,
                }}
                eventHandlers={{
                  click: () => onSelectAlert && onSelectAlert(spot.id),
                }}
              >
                <Popup>
                  <div className="text-xs min-w-[180px]">
                    <p className="font-bold text-sm">{spot.zone}</p>
                    <p className="text-gray-500 mt-0.5">{spot.eventType}</p>
                    <div className="mt-1.5 space-y-0.5">
                      <p>Risk Score: <strong>{spot.risk}/100</strong></p>
                      <p>Area affected: <strong>{spot.hectares} ha</strong></p>
                      <p>Source: <strong>{spot.source}</strong></p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-white/10 bg-[#08111f]/90 px-3 py-2 text-[10px] text-slate-300 backdrop-blur">
          <div>Protected area geometry: IDEFLOR-Bio (APA Triunfo do Xingu)</div>
          <div>
            DETER alerts: {isLoading ? "Loading live public alerts" : sources[0] || "ForestGuard fallback dataset"} ·{" "}
            {mode === "loading" ? "loading" : mode === "live" ? "live" : "fallback"} · {formatGeneratedAt(generatedAt)}
          </div>
          <div>View: dark basemap + red government alert dots + green protected-area outline</div>
        </div>
      </div>
    </Card>
  );
}
