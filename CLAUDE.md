# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal homepage links manager - a simple Node.js web application that serves as a dashboard for managing and accessing various home server services. The application provides a drag-and-drop interface for organizing links to local network services.

## Architecture

- **Backend**: Express.js server (`server.js`) running on port 3003
- **Frontend**: Vanilla HTML/CSS/JavaScript served from `public/` directory
- **Data Storage**: JSON file (`links.json`) for persistent link storage
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Deployment**: Can run directly with Node.js or via Docker container

### Key Files

- `server.js`: Main Express server with REST API endpoints for link management
- `public/index.html`: Primary frontend interface with drag-and-drop functionality
- `links.json`: Data store containing link configurations with name/URL pairs
- `public/styles.css`: Main styling for the interface
- Additional HTML files in `public/`: Various utility pages (sudoku, diagrams, etc.)

## Development Commands

```bash
# Install dependencies
npm install

# Start the server (direct Node.js)
npm start

# Docker commands
docker-compose up -d              # Start container in background
docker-compose down               # Stop container
docker-compose logs -f            # View container logs
docker-compose restart            # Restart container

# Backup data
cp links.json links.json.backup
```

## API Endpoints

- `GET /api/links` - Retrieve all links from storage
- `POST /api/links` - Save updated links array to storage with validation
  - Validates names (1-100 chars, no duplicates)
  - Validates URLs (valid HTTP/HTTPS format, supports localhost, IPs, .local domains)
  - Validates categories (must be 'servers', 'infrastructure', 'media', or 'websites')
  - Maximum 1000 links allowed
  - Returns 400 with detailed error messages on validation failure
- `GET /` - Serve main homepage interface

## Frontend Features

- **Quick Search**: Type-to-search functionality with fuzzy matching
  - Press `/` to open search overlay
  - Fuzzy matching supports partial character sequences (e.g., "pmx" matches "Proxmox")
  - Keyboard navigation with arrow keys
  - Instant navigation to links via Enter key
  - Shows up to 15 results with category icons
- Drag-and-drop link reordering
- In-line editing of link names and URLs with comprehensive validation
- Single edit mode to prevent data loss from concurrent edits
- Real-time input validation with user feedback
- URL normalization (auto-adds http:// prefix)
- Keyboard support (Enter key to save)
- Responsive grid layout with Font Awesome icons
- Dark theme interface
- Real-time persistence via API calls

### Keyboard Shortcuts

- `/` - Open search overlay
- `↑` `↓` - Navigate search results
- `Enter` - Open selected link (in search) or save edit (in edit mode)
- `Esc` - Close search overlay

## Data Format

Links are stored as JSON array with objects containing:
```json
{
  "name": "Service Name",
  "url": "http://server.local:port",
  "category": "servers"
}
```

### Categories

- **servers**: Core server applications and services
- **infrastructure**: Network infrastructure and system management tools
- **media**: Media streaming, entertainment, and utility applications
- **websites**: General web links and websites

## Network Context

The application is designed for local network use, with links pointing to various home server services on the 10.10.x.x network range. Services include media servers, development tools, monitoring dashboards, and network infrastructure. Can be deployed behind nginx as a reverse proxy.

## Docker Deployment

The application includes Docker support for containerized deployment:

- **Dockerfile**: Node.js 18 Alpine-based image with security best practices
- **docker-compose.yml**: Complete deployment configuration
  - Runs as non-root user (UID 1000)
  - Mounts `links.json` for data persistence
  - Includes health checks
  - Auto-restarts unless stopped manually
- Data persists through the mounted `links.json` volume

## Validation Rules

Server-side validation (implemented in server.js:60-180):
- **Names**: 1-100 characters, must be unique (case-insensitive)
- **URLs**: Must be valid HTTP/HTTPS format, max 2048 characters
- **Categories**: Must be one of: 'servers', 'infrastructure', 'media', 'websites'
- **Array limit**: Maximum 1000 links
- All validation errors return HTTP 400 with descriptive messages