"use client"
// @ts-check

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import defaultIcon from "@/components/mapIcon.js"

/** @typedef {{ _id: string; category: string; address: string; location: { coordinates: [number, number] } }} Incident */

/**
 * @param {{ incidents?: Incident[]; center?: [number, number] }} props
 */
export default function Map({
  incidents = /** @type {Incident[]} */ ([]),
  center = /** @type {[number, number]} */ ([28.5355, 77.3910]),
}) {
  const isNum = (v) => typeof v === "number" && isFinite(v)

  const safeCenter =
    Array.isArray(center) && isNum(center[0]) && isNum(center[1])
      ? center
      : [28.5355, 77.3910]

  const markers = (incidents || [])
    .filter((inc) => {
      const coords = inc?.location?.coordinates
      return Array.isArray(coords) && coords.length === 2 && isNum(coords[0]) && isNum(coords[1])
    })
    .map((incident) => ({
      ...incident,
      location: { coordinates: [incident.location.coordinates[1], incident.location.coordinates[0]] },
    }))

  return (
    <MapContainer center={safeCenter} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0 0 0.5rem 0.5rem" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      {markers.map((incident) => (
        <Marker key={incident._id} position={incident.location.coordinates} icon={defaultIcon}>
          <Popup>
            <b>{incident.category}</b><br />{incident.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
