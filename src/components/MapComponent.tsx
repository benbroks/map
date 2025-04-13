import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ImageMarker from './ImageMarker';
import ImageModal from './ImageModal';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Use a consistent LatLngTuple type
type LatLngTuple = [number, number];

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapComponentProps {
  gpxData: {
    points: LatLngTuple[];
  };
  onPointClick: (point: LatLngTuple) => void;
  selectedPoint: LatLngTuple | null;
}

interface ImageInfo {
  id: string;
  path: string;
  location: LatLngTuple;
  thumbnail?: string;
  description?: string;
  dateTaken?: string;
}

// Component to handle map bounds
const MapBounds = ({ points }: { points: LatLngTuple[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points);
    }
  }, [map, points]);
  
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  gpxData, 
  onPointClick,
  selectedPoint 
}) => {
  const polylineRef = useRef<any>(null);
  const { points } = gpxData;
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  
  // Calculate center point for initial map view
  const center: LatLngTuple = points.length > 0 
    ? points[Math.floor(points.length / 2)] 
    : [0, 0];
  
  // Load image metadata
  useEffect(() => {
    const fetchImageMetadata = async () => {
      try {
        var startTime = performance.now();
        const response = await fetch('/images/metadata.json');
        const data = await response.json();
        setImages(data.images);
      } catch (err) {
        console.error('Error loading image metadata:', err);
      }
    };

    fetchImageMetadata();
  }, []);

  const handlePolylineClick = (e: any) => {
    const clickedPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
    
    // Find the closest point on the route
    let closestPoint = points[0];
    let minDistance = Number.MAX_VALUE;
    
    points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(point[0] - clickedPoint[0], 2) + 
        Math.pow(point[1] - clickedPoint[1], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    onPointClick(closestPoint);
  };
  
  // Create a custom marker for the selected point
  const selectedMarkerIcon = new DivIcon({
    className: 'selected-point-marker',
    html: `<div style="
      background-color: #ff4500;
      border: 2px solid white;
      border-radius: 50%;
      height: 12px;
      width: 12px;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const handleImageClick = (image: ImageInfo) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polyline 
          positions={points}
          pathOptions={{ color: '#3388ff', weight: 5 }}
          eventHandlers={{
            click: handlePolylineClick
          }}
          ref={polylineRef}
        />
        
        {selectedPoint && (
          <Marker 
            position={selectedPoint} 
            icon={selectedMarkerIcon}
          />
        )}

        {/* Render image markers */}
        {images.map(image => (
          <ImageMarker 
            key={image.id} 
            image={image} 
            onImageClick={handleImageClick} 
          />
        ))}
        
        <MapBounds points={points} />
      </MapContainer>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
};

export default MapComponent; 