import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { DivIcon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ImageMarker from './ImageMarker';
import ImageModal from './ImageModal';
import GpxParser from 'gpxparser';

interface MapComponentProps {
  gpxData: {
    points: LatLngTuple[];
  };
  initialPoints?: LatLngTuple[];
  onPointClick: (point: LatLngTuple) => void;
  selectedPoint: LatLngTuple | null;
}

interface ImageInfo {
  id: string;
  path: string;
  location: LatLngTuple;
  thumbnail: string;
  description?: string;
  dateTaken?: string;
}

// Component to handle map bounds
const MapBounds = ({ points, isInitialLoad }: { points: LatLngTuple[], isInitialLoad: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0 && isInitialLoad) {
      map.fitBounds(points);
    }
  }, [map, points, isInitialLoad]);
  
  return null;
};

const BATCH_SIZE = 20; // Number of images to load at once
const GPX_FILES = Array.from({ length: 51 }, (_, i) => `/gpx-samples/Day_${i + 1}.gpx`);

const MapComponent: React.FC<MapComponentProps> = ({ 
  gpxData, 
  initialPoints,
  onPointClick,
  selectedPoint 
}) => {
  const polylineRef = useRef<any>(null);
  const { points } = gpxData;
  const [displayedPoints, setDisplayedPoints] = useState<LatLngTuple[]>(initialPoints || points);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loadedImages, setLoadedImages] = useState<ImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedGpxFiles, setLoadedGpxFiles] = useState<number>(1); // Start with 1 since we already loaded the first file
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Calculate center point for initial map view
  const center: LatLngTuple = displayedPoints.length > 0 
    ? displayedPoints[Math.floor(displayedPoints.length / 2)] 
    : [0, 0];
  
  // Load additional GPX files in background
  useEffect(() => {
    if (loadedGpxFiles >= GPX_FILES.length) return;

    const loadNextGpxFile = async () => {
      try {
        const nextFile = GPX_FILES[loadedGpxFiles];
        const response = await fetch(nextFile);
        const gpxContent = await response.text();
        const gpx = new GpxParser();
        gpx.parse(gpxContent);
        
        let newPoints: LatLngTuple[] = [];
        if (gpx.tracks.length > 0) {
          newPoints = gpx.tracks[0].points.map(
            (point: any) => [point.lat, point.lon] as LatLngTuple
          );
        } else if (gpx.routes.length > 0) {
          newPoints = gpx.routes[0].points.map(
            (point: any) => [point.lat, point.lon] as LatLngTuple
          );
        }

        setDisplayedPoints(prev => [...prev, ...newPoints]);
        setLoadedGpxFiles(prev => prev + 1);
        setIsInitialLoad(false); // After first update, we're no longer in initial load
      } catch (error) {
        console.error(`Error loading GPX file ${GPX_FILES[loadedGpxFiles]}:`, error);
        setLoadedGpxFiles(prev => prev + 1); // Skip this file and move to next
      }
    };

    // Load next file after a delay
    const timer = setTimeout(loadNextGpxFile, 1000);
    return () => clearTimeout(timer);
  }, [loadedGpxFiles]);

  // Load image metadata in batches
  useEffect(() => {
    const fetchImageMetadata = async () => {
      try {
        const response = await fetch('/images/metadata.json');
        const data = await response.json();
        setImages(data.images);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading image metadata:', err);
        setIsLoading(false);
      }
    };

    fetchImageMetadata();
  }, []);

  // Progressive image loading
  useEffect(() => {
    if (images.length === 0) return;

    const loadNextBatch = () => {
      const nextBatch = images.slice(loadedImages.length, loadedImages.length + BATCH_SIZE);
      if (nextBatch.length === 0) return;

      setLoadedImages(prev => [...prev, ...nextBatch]);
    };

    // Load first batch immediately
    if (loadedImages.length === 0) {
      loadNextBatch();
    }

    // Load subsequent batches with a delay
    const timer = setInterval(loadNextBatch, 500);
    return () => clearInterval(timer);
  }, [images, loadedImages.length]);

  const handlePolylineClick = (e: any) => {
    const clickedPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
    
    // Find the closest point on the route
    let closestPoint = displayedPoints[0];
    let minDistance = Number.MAX_VALUE;
    
    displayedPoints.forEach(point => {
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
          positions={displayedPoints}
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

        {/* Render loaded image markers */}
        {loadedImages.map(image => (
          <ImageMarker 
            key={image.id} 
            image={image} 
            onImageClick={handleImageClick} 
          />
        ))}
        
        <MapBounds points={displayedPoints} isInitialLoad={isInitialLoad} />
      </MapContainer>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={handleCloseModal} 
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Loading map data... ({loadedGpxFiles}/{GPX_FILES.length} routes loaded)
        </div>
      )}
    </>
  );
};

export default MapComponent; 