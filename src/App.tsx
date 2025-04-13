import { useState } from 'react'
import './App.css'
import MapComponent from './components/MapComponent'
import GpxSelector from './components/GpxSelector'
import StreetViewComponent from './components/StreetViewComponent'
import { LatLngTuple } from 'leaflet'

function App() {
  const [gpxData, setGpxData] = useState<{ points: LatLngTuple[] } | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<LatLngTuple | null>(null)

  const handleGpxSelect = (points: LatLngTuple[]) => {
    setGpxData({ points })
    setSelectedPoint(null) // Reset selected point when a new GPX is loaded
  }

  const handlePointClick = (point: LatLngTuple) => {
    setSelectedPoint(point)
  }

  return (
    <div className="app-container">
      <header>
        <h1>GPX Street Explorer</h1>
        <div className="header-controls">
          <GpxSelector onGpxSelect={handleGpxSelect} />
        </div>
      </header>
      <main>
        <div className="map-container">
          {gpxData && (
            <MapComponent 
              gpxData={gpxData} 
              onPointClick={handlePointClick} 
              selectedPoint={selectedPoint}
            />
          )}
        </div>
        <div className="street-view-container">
          {selectedPoint && (
            <StreetViewComponent position={selectedPoint} />
          )}
          {!selectedPoint && (
            <div className="empty-state">
              <p>Select a point on the route to view Street View</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
