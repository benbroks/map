import { useState, useEffect } from 'react';
import { LatLngTuple } from 'leaflet';
import GpxParser from 'gpxparser';

interface GpxSelectorProps {
  onGpxSelect: (points: LatLngTuple[]) => void;
}

interface GpxFile {
  id: string;
  name: string;
  path: string;
}

const GpxSelector: React.FC<GpxSelectorProps> = ({ onGpxSelect }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const gpxFiles: GpxFile[] = Array.from({ length: 51 }, (_, i) => {
    const day = i + 1;
    return {
      id: day.toString(),
      name: `Day ${day}`,
      path: `/gpx-samples/Day_${day}.gpx`
    };
  });

  useEffect(() => {
    loadAllGpxFiles();
  }, []);

  const loadAllGpxFiles = async () => {
    setIsLoading(true);
    try {
      const allPoints: LatLngTuple[] = [];
      
      for (const file of gpxFiles) {
        try {
          const response = await fetch(file.path);
          const gpxContent = await response.text();
          const points = parseGpxFile(gpxContent);
          allPoints.push(...points);
        } catch (error) {
          console.error(`Error loading GPX file ${file.path}:`, error);
        }
      }
      
      onGpxSelect(allPoints);
    } catch (error) {
      console.error('Error loading GPX files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseGpxFile = (gpxContent: string): LatLngTuple[] => {
    const gpx = new GpxParser();
    gpx.parse(gpxContent);
    
    if (gpx.tracks.length > 0) {
      // Extract points from the first track
      return gpx.tracks[0].points.map(
        (point: any) => [point.lat, point.lon] as LatLngTuple
      );
    } else if (gpx.routes.length > 0) {
      // If no tracks, try to use routes
      return gpx.routes[0].points.map(
        (point: any) => [point.lat, point.lon] as LatLngTuple
      );
    } else {
      console.error('No tracks or routes found in the GPX file');
      return [];
    }
  };

  return (
    <div className="gpx-selector">
      {isLoading && <span className="loading-indicator">Loading routes...</span>}
    </div>
  );
};

export default GpxSelector; 