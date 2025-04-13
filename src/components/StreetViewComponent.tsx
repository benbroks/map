import { useState, useEffect } from 'react';
import { LatLngTuple } from 'leaflet';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

interface StreetViewComponentProps {
  position: LatLngTuple;
}

// You'll need to replace this with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const StreetViewComponent: React.FC<StreetViewComponentProps> = ({ position }) => {
  const [panoramaPosition, setPanoramaPosition] = useState<google.maps.LatLng | null>(null);
  const [noStreetView, setNoStreetView] = useState<boolean>(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [panorama, setPanorama] = useState<google.maps.StreetViewPanorama | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (isLoaded && position && map) {
      const [lat, lng] = position;
      const latLng = new google.maps.LatLng(lat, lng);
      setPanoramaPosition(latLng);
      
      // Check if Street View is available at this location
      const streetViewService = new google.maps.StreetViewService();
      streetViewService.getPanorama(
        { location: latLng, radius: 50 },
        (data, status) => {
          if (status === google.maps.StreetViewStatus.OK) {
            setNoStreetView(false);
            
            // Create a new StreetViewPanorama instance
            if (!panorama) {
              const newPanorama = new google.maps.StreetViewPanorama(
                document.getElementById('street-view-container') as HTMLElement,
                {
                  position: latLng,
                  pov: { heading: 0, pitch: 0 },
                  enableCloseButton: false,
                  addressControl: false,
                  fullscreenControl: false,
                  motionTracking: false,
                  motionTrackingControl: false,
                }
              );
              map.setStreetView(newPanorama);
              setPanorama(newPanorama);
            } else {
              panorama.setPosition(latLng);
            }
          } else {
            setNoStreetView(true);
          }
        }
      );
    }
  }, [isLoaded, position, map, panorama]);

  const onMapLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  if (!isLoaded) {
    return <div className="loading">Loading Street View...</div>;
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {noStreetView ? (
        <div className="no-street-view">
          <p>Street View is not available at this location.</p>
        </div>
      ) : (
        <>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={panoramaPosition || undefined}
            zoom={14}
            onLoad={onMapLoad}
          />
          <div 
            id="street-view-container" 
            style={{ 
              height: '100%', 
              width: '100%', 
              position: 'absolute', 
              top: 0, 
              left: 0 
            }}
          />
        </>
      )}
    </div>
  );
};

export default StreetViewComponent; 