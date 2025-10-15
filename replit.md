# Overview

Thoxt Reels is an AI-powered video creation platform built as a full-stack web application. It serves as a social media platform with a focus on creating engaging video content (reels) using artificial intelligence for script generation and professional editing tools. The platform targets journalists, bloggers, and content creators who want to transform written articles or custom topics into compelling video content.

The application provides a comprehensive suite of features including AI-assisted script generation from existing articles or custom topics, a professional video recording interface with teleprompter functionality, smart editing tools with auto-captioning and noise reduction, and seamless export options for social media platforms.

## Recent Changes (October 2025)

### Portrait Camera & Overlay Recording (Latest - October 15, 2025)
- **Instagram-Style Portrait Video** ✅:
  - Camera displays naturally based on device orientation (no preview rotation)
  - Works when phone is held PORTRAIT (upright/vertical) like Instagram
  - Camera flip button (⟲) to switch between front/back camera
  - Final recorded video ALWAYS 1080x1920 portrait output
  - Canvas recording rotates landscape feeds to portrait automatically
  - Mobile web app meta tags for full-screen experience
- **Overlay Recording with Rotation Support** ✅:
  - Overlays stored as relative positions (0-1 range) - device independent
  - Canvas always outputs 1080x1920 portrait video
  - Coordinate transformation for landscape: (x,y) → (height-y, x) for 90° rotation
  - Same rotation matrix applied to both video and overlays
  - Size scaling works for both portrait and rotated landscape cameras
  - Drawing order: video frame FIRST, then overlays on TOP
  - Text/sticker alignment: center/middle for accurate positioning
- **Workflow** ✅:
  - After recording → Save → Redirects to /saved-reels (not /editor)
  - Edit button added to each reel card in saved reels page
  - Edit button (purple gradient) opens /editor with reel ID
  - Clean workflow: Record → Save → My Reels → Edit (optional)

## Recent Changes (October 2025)

### Complete Rewrite to Python Flask Stack (Latest - October 14, 2025)
- **Architecture Migration** ✅:
  - Completely rebuilt application using Python Flask backend
  - Replaced React/TypeScript frontend with vanilla HTML/CSS/JavaScript
  - SQLite database for local data persistence
  - Node.js shim wrapper in server/index.ts spawns Flask app
  - Workflow still runs `npm run dev` but boots Flask instead of TypeScript server
- **Technology Stack**:
  - Backend: Python 3.11 + Flask + Flask-CORS
  - Frontend: Vanilla JavaScript + HTML5 + CSS3
  - Database: SQLite (local file-based)
  - Media: IndexedDB for client-side video storage
  - Server: Flask development server on port 5000
- **Core Features**:
  - Video recording with MediaRecorder API
  - Canvas-based recording for mirror mode and filter effects
  - **Instagram-style vertical sidebar** - Right-side sidebar with 5 sections (TEXT, STICKER, FILTER, MUSIC, MIRROR)
  - **Instagram-style live filters** - 9 professional filters (Valencia, Nashville, Toaster, Walden, Lo-Fi, Clarendon, Gingham, Black & White)
  - **Video upload support** - Import videos (MP4, WebM, MOV) with drag-and-drop or file browser
  - Teleprompter with script display
  - Professional UI with symbolic icons (no emojis)
  - Saved reels page with playback
  - Mobile-responsive design with dark theme
  
### Instagram-Style Sidebar Implementation (October 14, 2025)
- **Vertical Sidebar on Recording Page** ✅:
  - Right-side vertical sidebar with 5 interactive sections
  - Each section opens expandable panel at bottom when clicked
  - Only one panel open at a time
  - Active section highlighted with yellow background
- **5 Sections**:
  1. **TEXT** - Draggable text overlays with font selection (Arial, Impact, Georgia, Comic Sans, Courier), size slider (20-120px), color picker
  2. **STICKER** - Draggable emoji stickers (8 options) with size slider (30-150px)
  3. **FILTER** - Apply Instagram filters (9 professional filters including B&W)
  4. **MUSIC** - Background music (placeholder)
  5. **MIRROR** - Toggle mirror mode with status indicator
- **Panel Behavior**:
  - Slides up from bottom with animation
  - Close button (✕) dismisses panel
  - Clicking new section auto-closes previous panel
- **Draggable Overlays** ✅:
  - Text and stickers can be repositioned by clicking and dragging
  - Desktop: Click and drag with mouse
  - Mobile: Single touch to drag, two-finger pinch to zoom/resize
  - Selected overlays show yellow dashed outline
  - All overlays baked into recorded video
  
### Advanced Video Editor Implementation (October 14, 2025)
- **Professional Editor Interface** ✅:
  - Dedicated /editor route with comprehensive editing tools
  - User flow: Record → Save → Edit → Export to Gallery
  - Dual-layer video system for before/after comparison
  - Synchronized playback with drift correction
- **Instagram-Quality Filters** ✅:
  - 8 professional filters: Valencia, Nashville, Toaster, Walden, Lo-Fi, Clarendon, Gingham
  - Before/after comparison slider with dual-layer video
  - Real-time filter preview
- **Text Overlay System** ✅:
  - Custom text with font selection (Arial, Impact, Georgia, Comic Sans)
  - Adjustable size and color
  - Draggable positioning
  - Animation effects: Fade In, Slide, Bounce
- **Music Library** ✅:
  - 4 background tracks: Upbeat Energy, Chill Vibes, Dramatic, Ambient
  - Volume control
  - Track preview functionality
- **Sticker System** ✅:
  - 8 emoji stickers with draggable placement
  - Scalable positioning
- **Drawing Tools** ✅:
  - Freehand drawing with custom colors
  - Adjustable brush size
  - Clear drawing functionality
- **AI Transcript** ⚠️:
  - UI and workflow implemented
  - Requires backend integration with speech-to-text API (OpenAI Whisper, Google Cloud Speech-to-Text, etc.)
  - Caption application system ready
  - Audio extraction from video blob needs server-side processing
  
### Critical Bug Fixes (October 14, 2025)
- **Mirror Recording Fix** ✅:
  - Canvas-based recording captures mirror transform in video blob
  - Filter effects also baked into recorded video
  - 30 FPS canvas capture with audio preservation
- **UI Professional Update** ✅:
  - Removed all emojis from interface
  - Replaced with professional symbolic icons
  - Clean, mature presentation

### Mobile UX Improvements & Critical Fixes (October 14, 2025)
- **Camera Portrait Orientation Fix** ✅: 
  - Camera requests true portrait mode (1080x1920, 9:16 aspect ratio)
  - Uses flexible `ideal` constraints instead of rigid `min` to support various mobile cameras
  - Automatic landscape detection and rotation on mobile devices
  - Verified working with e2e tests: recorded videos are 1080x1920 portrait
- **Canvas Recording Mode Enhancement** ✅:
  - Canvas recording ALWAYS activates when rotation needed on mobile
  - Fixed critical bug where mirror-off mode would skip rotation
  - Rotation applied to actual recorded blob, not just preview
  - Works regardless of mirror, filter, or overlay state
- **Video Orientation Detection** ✅:
  - Detects landscape videos (videoWidth > videoHeight) on mobile
  - Applies 90° rotation via CSS for preview feedback
  - Applies 90° canvas transform during recording for portrait output
  - State initialization fixed to prevent ReferenceErrors
- **Audio Playback Fix** ✅:
  - Saved reels play with audio (removed muted attribute)
  - User-controlled playback (no autoplay)
  - Full sound support for recorded videos
- **Mobile-Responsive Saved Reels Page** ✅:
  - Fully adaptive layout for mobile devices
  - No sidebar overlap on mobile (md:ml-64 instead of ml-64)
  - Responsive header with flex-col on mobile
  - Full-width buttons on mobile, auto-width on desktop
  - Responsive text sizing across all screen sizes
- **Enhanced Swipe Gesture**:
  - Visible yellow pulsing indicator when swiping right (>10px)
  - Shows animated arrow icon and "Swipe to exit" text
  - Exits to options menu at 100px+ swipe with 300ms slide-out animation
- **Professional Options Menu**:
  - Clean black background with minimal design
  - Card-based options with colored borders (purple/yellow/blue)
  - Touch feedback with active scale animation
  - Options: My Reels, Create New Reel, AI Teleprompter
- **Fullscreen Mobile Recorder**: 
  - Fills viewport on devices <768px width
  - Exit button (X) navigates to options menu
- **Reel Persistence**: IndexedDB storage with video blobs, metadata, and auto-generated thumbnails

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built using vanilla HTML5, CSS3, and JavaScript. HTML templates are served by Flask using Jinja2 templating engine. The UI features a custom dark theme with yellow accent colors, fully responsive design for mobile and desktop.

Key frontend architectural decisions:
- **Template System**: Jinja2 templates in `/templates/` directory with base.html layout
- **Styling System**: Pure CSS3 with CSS custom properties, mobile-first responsive design
- **JavaScript**: Vanilla JavaScript for all interactions, no frameworks or build tools
- **Media Handling**: MediaRecorder API for video recording, IndexedDB for client-side storage
- **Mobile Support**: Touch-optimized controls, fullscreen recorder, gesture navigation

## Backend Architecture

The server-side is built with Python Flask, a lightweight WSGI web application framework. The application runs on a development server in debug mode with hot reloading.

Database architecture uses SQLite for local data persistence with a simple schema for reels storage. The Flask app is spawned by a Node.js shim (server/index.ts) to integrate with the existing Replit workflow system.

API structure follows RESTful conventions with endpoints for:
- Reel CRUD operations (`/api/reels`)
- View and like tracking (`/api/reels/<id>/views`, `/api/reels/<id>/likes`)
- Static file serving for CSS, JavaScript, and media assets

Key backend architectural decisions:
- **Framework**: Flask chosen for simplicity and Python ecosystem
- **Database**: SQLite for local file-based storage, no external dependencies
- **Template Engine**: Jinja2 for server-side HTML rendering
- **API Design**: RESTful JSON API with CORS support for cross-origin requests
- **Process Management**: Node.js shim wrapper for workflow integration

## Data Storage Solutions

The application uses a hybrid storage approach:
- **Primary Database**: SQLite (local file-based database in reels.db)
- **Client Storage**: IndexedDB (ThoxtReelsDB) for video blobs and thumbnails
- **Media Storage**: Browser-based blob storage with download capabilities
- **Session Storage**: In-memory during active recording sessions

Database schema design:
- Reels table with id, title, duration, thumbnail, video_blob, views, likes, created_at
- IndexedDB stores complete video blobs for playback and download
- Thumbnail generation using HTML5 Canvas API

## Authentication and Authorization

Currently implements a basic user management system with username/password authentication. The schema supports user creation and retrieval operations with plans for session-based authentication.

Authentication architecture considerations:
- User table with unique username constraints
- Password storage (implementation details to be enhanced with hashing)
- Session management capabilities built into the query client
- Authorization middleware ready for implementation

## External Service Integrations

### AI Services
- **OpenAI GPT-4o Integration**: Primary AI service for script generation from articles and custom topics
- **Script Generation Pipeline**: Configurable tone (engaging, formal, funny, educational) and duration (15s, 30s, 60s) options

### Cloud Services
- **Google Cloud Storage**: Media asset storage and CDN capabilities
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling

### Media Processing
- **FFmpeg Integration**: Client-side video processing through @ffmpeg/ffmpeg and @ffmpeg/util
- **Uppy File Upload**: Professional file upload interface with AWS S3 integration capabilities
- **Video Processing Pipeline**: Thumbnail generation, format conversion, and watermarking capabilities

### Development Tools
- **Replit Integration**: Development environment integration with runtime error handling
- **Vite Development Server**: Hot module replacement and development tooling
- **TypeScript Compilation**: Build-time type checking and code generation

The architecture supports scalable deployment with clear separation of concerns between frontend presentation, backend API logic, database persistence, and external service integrations.