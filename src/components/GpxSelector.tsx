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
    loadFirstGpxFile();
  }, []);

  const loadFirstGpxFile = async () => {
    setIsLoading(true);
    try {
      const firstFile = gpxFiles[0];
      const response = await fetch(firstFile.path);
      const gpxContent = await response.text();
      const points = parseGpxFile(gpxContent);
      onGpxSelect(points);
    } catch (error) {
      console.error('Error loading first GPX file:', error);
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
      {isLoading && <span className="loading-indicator">Loading initial route...</span>}
    </div>
  );
};

export default GpxSelector; 