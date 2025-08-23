# Links Manager

A personal home server dashboard application for managing and accessing local network services with a drag-and-drop interface.

## Overview

This application serves as a centralized dashboard for managing links to various home server services. It provides an intuitive interface for organizing services into categories (Servers, Infrastructure & System, Media & Apps) with drag-and-drop functionality for easy reordering.

## Features

- **Categorized Organization**: Links are organized into three main categories:
  - **Servers**: Core server applications (Proxmox, Docker, TrueNAS, etc.)
  - **Infrastructure & System**: Network and system management tools
  - **Media & Apps**: Entertainment and utility applications

- **Drag-and-Drop Interface**: Easily reorder links within categories by dragging them
- **In-line Editing**: Click edit button to modify link names and URLs directly
- **Real-time Persistence**: Changes are automatically saved to the server
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy-on-the-eyes dark interface with modern styling
- **Font Awesome Icons**: Clean, professional iconography throughout

## Architecture

### Backend
- **Framework**: Express.js server
- **Port**: 3003
- **Data Storage**: JSON file (`links.json`)
- **Module System**: ES modules

### Frontend
- **Technology**: Vanilla HTML, CSS, JavaScript
- **Styling**: Modern CSS with CSS variables for theming
- **Layout**: CSS Grid for responsive 3-column layout
- **Icons**: Font Awesome

### File Structure
```
links-manager/
├── server.js              # Express server with API endpoints
├── package.json           # Dependencies and scripts
├── links.json             # Link data storage
├── public/
│   ├── index.html         # Main application interface
│   ├── styles.css         # Application styling
│   ├── all.min.css        # Font Awesome icons
│   └── [other-pages].html # Additional utility pages
└── README.md              # This documentation
```

## API Endpoints

### GET /api/links
Retrieves all links from storage.

**Response**: Array of link objects
```json
[
  {
    "name": "Service Name",
    "url": "http://server.local:port",
    "category": "servers|infrastructure|media"
  }
]
```

### POST /api/links
Saves updated links array to storage.

**Request Body**: Array of link objects (same format as GET response)

**Response**: 200 OK on success

### GET /
Serves the main homepage interface.

## Data Structure

Links are stored as JSON objects with the following structure:

```json
{
  "name": "Service Name",        // Display name for the service
  "url": "http://server:port",   // Full URL to the service
  "category": "servers"          // Category: servers, infrastructure, or media
}
```

### Categories

- **servers**: Core server applications and services
- **infrastructure**: Network infrastructure and system management tools  
- **media**: Media streaming, entertainment, and utility applications

## Installation & Setup

1. **Clone or download** the application files to your server
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the server**:
   ```bash
   npm start
   ```
4. **Access the application** at `http://your-server:3003`

## Usage

### Adding Links
1. Click the "Add [Category] Link" button in the desired category
2. Enter the service name and URL
3. Click the checkmark to save or X to cancel

### Editing Links
1. Click the edit icon (pencil) next to any link
2. Modify the name or URL as needed
3. Click the checkmark to save or X to cancel

### Moving Links Between Categories
1. Drag any link to a different category column
2. The link will automatically change categories
3. Changes are automatically saved

### Reordering Links
1. Drag any link by the grip handle (⋮⋮) on the left
2. Drop it in the desired position within the same category or different category
3. Changes are automatically saved

### Deleting Links
1. Click the delete icon (trash) next to any link
2. Confirm the deletion in the popup dialog

## Configuration

### Network Context
The application is designed for local network use with services typically running on:
- `10.10.x.x` network range
- Various ports for different services
- Local domain names (e.g., `server.local`)

### Customization
- **Themes**: Modify CSS variables in `styles.css` for different color schemes
- **Layout**: Adjust grid properties in the `.columns-container` CSS rule
- **Categories**: Add new categories by updating both frontend JavaScript and CSS

## Backup & Recovery

### Manual Backups
To create manual backups of your link data:
```bash
# Backup link data
cp links.json links.json.backup

# Backup entire application
cp -r /var/www/node/links-manager /var/www/node/links-manager.backup
```

## Security Considerations

- **Local Network Only**: Designed for internal network use
- **No Authentication**: Access control should be handled at the network level
- **Input Validation**: URLs are validated on the frontend before saving
- **XSS Protection**: User input is properly escaped in the interface

## Troubleshooting

### Port Already in Use
If you see "EADDRINUSE" error:
```bash
# Find process using port 3003
lsof -i :3003

# Kill the process if needed
kill -9 <PID>
```

### Links Not Saving
1. Check server console for error messages
2. Verify `links.json` file permissions
3. Ensure the server has write access to the directory

### Layout Issues
1. Clear browser cache and refresh
2. Check CSS console errors in browser developer tools
3. Verify all CSS files are loading correctly

## Development

### Adding New Features
1. Follow the existing code patterns and conventions
2. Update both frontend JavaScript and backend API as needed
3. Test thoroughly across different browsers and devices
4. Update documentation for any new features

### Code Style
- Use ES modules (`import`/`export`)
- Follow existing naming conventions
- Add comments for complex functionality
- Maintain responsive design principles

## License

This project is designed for personal home server use. Modify and distribute as needed for your own home network setup.