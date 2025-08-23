# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal homepage links manager - a simple Node.js web application that serves as a dashboard for managing and accessing various home server services. The application provides a drag-and-drop interface for organizing links to local network services.

## Architecture

- **Backend**: Express.js server (`server.js`) running on port 3003
- **Frontend**: Vanilla HTML/CSS/JavaScript served from `public/` directory
- **Data Storage**: JSON file (`links.json`) for persistent link storage
- **Module System**: ES modules (`"type": "module"` in package.json)

### Key Files

- `server.js`: Main Express server with REST API endpoints for link management
- `public/index.html`: Primary frontend interface with drag-and-drop functionality
- `links.json`: Data store containing link configurations with name/URL pairs
- `public/styles.css`: Main styling for the interface
- Additional HTML files in `public/`: Various utility pages (sudoku, diagrams, etc.)

## Development Commands

```bash
# Start the server
npm start

# Install dependencies
npm install
```

## API Endpoints

- `GET /api/links` - Retrieve all links from storage
- `POST /api/links` - Save updated links array to storage
- `GET /` - Serve main homepage interface

## Frontend Features

- Drag-and-drop link reordering
- In-line editing of link names and URLs
- Responsive grid layout with Font Awesome icons
- Dark theme interface
- Real-time persistence via API calls

## Data Format

Links are stored as JSON array with objects containing:
```json
{
  "name": "Service Name",
  "url": "http://server.local:port"
}
```

## Network Context

The application is designed for local network use, with links pointing to various home server services on the 10.10.x.x network range. Services include media servers, development tools, monitoring dashboards, and network infrastructure.