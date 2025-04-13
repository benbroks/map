import { useState, useEffect } from 'react';
import heic2any from 'heic2any';

interface ImageInfo {
  id: string;
  path: string;
  location: LatLngTuple;
  thumbnail?: string;
  description?: string;
  dateTaken?: string;
}

interface ImageModalProps {
  image: ImageInfo | null;
  onClose: () => void;
}

type LatLngTuple = [number, number];

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      loadImage(image.thumbnail);
    } else {
      setDisplayImage(null);
    }

    // Add event listener for escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      // Revoke object URL if it exists
      if (displayImage && displayImage.startsWith('blob:')) {
        URL.revokeObjectURL(displayImage);
      }
    };
  }, [image, onClose]);

  const loadImage = async (imagePath: string) => {
    if (!imagePath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Just use the path directly since we're assuming it's a jpg
      setDisplayImage(imagePath);
    } catch (err) {
      console.error('Error loading image:', err);
      setError('Failed to load image. The format may not be supported.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  if (!image) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>×</button>
        
        {loading && (
          <div className="loading-indicator">Loading image...</div>
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {displayImage && !loading && !error && (
          <div className="modal-image-container">
            <img 
              src={displayImage} 
              alt={image.description || "Location view"} 
              className="modal-image"
            />
          </div>
        )}
        
        <div className="modal-image-info">
          {image.description && (
            <h3>{image.description}</h3>
          )}
          {image.dateTaken && (
            <p className="image-date">Taken on {formatDate(image.dateTaken)}</p>
          )}
          <p className="image-location">
            Location: {image.location[0].toFixed(6)}, {image.location[1].toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 