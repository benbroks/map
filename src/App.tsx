import { useState, useMemo } from 'react'
import './App.css'
import MapComponent from './components/MapComponent'
import GpxSelector from './components/GpxSelector'
import StreetViewComponent from './components/StreetViewComponent'
import { LatLngTuple } from 'leaflet'

function App() {
  const [gpxData, setGpxData] = useState<{ points: LatLngTuple[] } | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<LatLngTuple | null>(null)

  // Create a subset of points for initial render (every 10th point)
  const initialPoints = useMemo(() => {
    if (!gpxData) return undefined;
    return gpxData.points.filter((_, index) => index % 10 === 0);
  }, [gpxData]);

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
        <div className="header-left">
          <a href="https://brooks.team" className="home-link" title="Return to brooks.team">
            <span className="home-icon">🏠</span>
          </a>
          <h1>Street View my Cross-Country Bike Ride</h1>
        </div>
        <div className="header-controls">
          <GpxSelector onGpxSelect={handleGpxSelect} />
        </div>
      </header>
      <main>
        <div className="map-container">
          {gpxData && (
            <MapComponent 
              gpxData={gpxData} 
              initialPoints={initialPoints}
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
