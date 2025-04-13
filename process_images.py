#!/usr/bin/env python3
import os
import json
import uuid
import argparse
from datetime import datetime
from PIL import Image, ExifTags
import pillow_heif

# Register HEIF/HEIC file format with Pillow
pillow_heif.register_heif_opener()

def get_exif(filename):
    """Extract GPS EXIF data from an image file."""
    image = Image.open(filename)
    image.verify()
    return image.getexif().get_ifd(0x8825)

def get_geotagging(exif):
    """Convert EXIF GPS data into a structured dictionary."""
    geo_tagging_info = {}
    if not exif:
        return None
    
    gps_keys = ['GPSVersionID', 'GPSLatitudeRef', 'GPSLatitude', 'GPSLongitudeRef', 'GPSLongitude',
                'GPSAltitudeRef', 'GPSAltitude', 'GPSTimeStamp', 'GPSSatellites', 'GPSStatus', 'GPSMeasureMode',
                'GPSDOP', 'GPSSpeedRef', 'GPSSpeed', 'GPSTrackRef', 'GPSTrack', 'GPSImgDirectionRef',
                'GPSImgDirection', 'GPSMapDatum', 'GPSDestLatitudeRef', 'GPSDestLatitude', 'GPSDestLongitudeRef',
                'GPSDestLongitude', 'GPSDestBearingRef', 'GPSDestBearing', 'GPSDestDistanceRef', 'GPSDestDistance',
                'GPSProcessingMethod', 'GPSAreaInformation', 'GPSDateStamp', 'GPSDifferential']

    for k, v in exif.items():
        try:
            geo_tagging_info[gps_keys[k]] = v
        except IndexError:
            pass
    return geo_tagging_info

def extract_coordinates(geo_tags):
    """Extract coordinates from GPS tags dictionary."""
    if not geo_tags or 'GPSLatitude' not in geo_tags or 'GPSLongitude' not in geo_tags:
        return None

    def convert_to_decimal(value, ref):
        degrees = float(value[0])
        minutes = float(value[1]) / 60.0
        seconds = float(value[2]) / 3600.0
        decimal = degrees + minutes + seconds
        if ref in ['S', 'W']:
            decimal = -decimal
        return decimal

    try:
        lat = convert_to_decimal(geo_tags['GPSLatitude'], geo_tags['GPSLatitudeRef'])
        lng = convert_to_decimal(geo_tags['GPSLongitude'], geo_tags['GPSLongitudeRef'])
        return [lat, lng]
    except (KeyError, ValueError, TypeError):
        return None

def extract_date_taken(image_path):
    """Extract the date when the image was taken."""
    try:
        img = Image.open(image_path)
        exif = img.getexif()
        if not exif:
            return None
        
        for tag, value in exif.items():
            
            tag_name = ExifTags.TAGS.get(tag, tag)
            if tag_name == 'DateTime':
                try:
                    dt = datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
                    return dt.isoformat() + '.000Z'
                except ValueError:
                    return None
        return None
    except Exception:
        return None

def process_images(input_dir, output_json, thumbnails_dir, thumbnail_prefix='/images/thumbnails/'):
    """Process all HEIC images in the input directory and generate metadata JSON."""
    if not os.path.exists(thumbnails_dir):
        os.makedirs(thumbnails_dir)
    
    images_data = []
    # Counter to track number of processed files
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.heic', '.heif')):
            file_path = os.path.join(input_dir, filename)
            
            try:
                # Extract GPS data using the new method
                gps_exif = get_exif(file_path)
                geo_tags = get_geotagging(gps_exif)
                location = extract_coordinates(geo_tags) if geo_tags else None
                
                if not location:
                    print(f"Warning: No GPS data found for {filename}, skipping.")
                    continue
                
                # Extract date taken
                date_taken = extract_date_taken(file_path)
                
                # Generate thumbnail
                img = Image.open(file_path)
                thumbnail_filename = os.path.splitext(filename)[0] + '.jpg'
                thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
                
                # Resize and save as JPEG
                img.thumbnail((800, 800))
                img = img.convert('RGB')  # Convert to RGB for JPEG
                img.save(thumbnail_path, 'JPEG')
                
                # Create image metadata
                image_id = str(uuid.uuid4())[:8]  # Generate a short UUID
                image_data = {
                    "id": image_id,
                    "path": f"/images/raw_images/{filename}",
                    "thumbnail": f"{thumbnail_prefix}{thumbnail_filename}",
                    "location": location,
                    "description": f"Image at {location[0]:.6f}, {location[1]:.6f}",
                }
                
                if date_taken:
                    image_data["dateTaken"] = date_taken
                
                images_data.append(image_data)
                print(f"Processed {filename}")
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    # Write metadata to JSON file
    metadata = {"images": images_data}
    with open(output_json, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Processed {len(images_data)} images. Metadata saved to {output_json}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process HEIC images and generate metadata JSON.')
    parser.add_argument('--input', default='public/images/raw_images', help='Input directory containing HEIC images')
    parser.add_argument('--output', default='public/images/metadata1.json', help='Output JSON file path')
    parser.add_argument('--thumbnails', default='public/images/thumbnails', help='Directory to save thumbnails')
    
    args = parser.parse_args()
    
    process_images(args.input, args.output, args.thumbnails)
