# GPX Street Explorer

A web application that allows you to visualize GPX routes on a map and explore them using Google Street View and view HEIF/HEIC images associated with locations along the route.

## Features

- Upload and visualize GPX files on an interactive map
- Click on any point of the route to view the Google Street View at that location
- View HEIF/HEIC images associated with locations along the route
- Images appear as markers directly on the map
- Click on image markers to view thumbnails and full-size images
- Responsive design that works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Google Maps API key with Street View API enabled

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/gpx-street-explorer.git
   cd gpx-street-explorer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Add your Google Maps API key:
   Open `src/components/StreetViewComponent.tsx` and replace `'YOUR_GOOGLE_MAPS_API_KEY'` with your actual Google Maps API key.

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## How to Use

1. Select a GPX route from the dropdown menu.
2. Once loaded, the GPX route will be displayed on the map.
3. Click on any point along the route to see the Google Street View at that location.
4. Camera icons on the map indicate locations where images are available.
5. Click on a camera icon to see a thumbnail of the image and click again to view the full-size image.

## Adding Your Own Images

### Automatic Method (Recommended)

We've included scripts to automatically process your images and generate the necessary metadata:

1. Place your HEIC/HEIF or other image files in the `public/images` directory.
2. Run the image processing script:
   ```
   npm run process-images
   ```
3. The script will:
   - Generate thumbnails in the `public/images/thumbnails` directory
   - Extract GPS coordinates and other metadata from the EXIF data
   - Create a `metadata.json` file automatically

For more details about the image processing scripts, see the [scripts/README.md](scripts/README.md) file.

### Manual Method

If you prefer to add images manually:

1. Place your HEIF/HEIC images in the `public/images` directory.
2. Create thumbnails (JPEG format recommended) in the `public/images/thumbnails` directory.
3. Update the `public/images/metadata.json` file with information about your images, including:
   - Unique ID
   - File path
   - Geographic coordinates (latitude, longitude)
   - Thumbnail path
   - Description (optional)
   - Date taken (optional)

Example metadata.json format:
```json
{
  "images": [
    {
      "id": "1",
      "path": "/images/sample1.heic",
      "location": [37.8075, -122.4219],
      "thumbnail": "/images/thumbnails/sample1.jpg",
      "description": "View of San Francisco Bay",
      "dateTaken": "2023-06-15T14:30:00Z"
    }
  ]
}
```

## Building for Production

To build the application for production, run:

```
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Acknowledgments

- OpenStreetMap for providing the map tiles
- Leaflet for the interactive map functionality
- Google for the Street View API
