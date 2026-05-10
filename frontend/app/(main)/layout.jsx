// frontend/app/layout.jsx

import { Header } from "@/components/header.jsx"
import "leaflet/dist/leaflet.css"

export default function MainAppLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}
