# Thoxt Reels - AI-Powered Video Creation Platform

## Project Overview and Motivation

Thoxt Reels is a comprehensive video recording and editing platform designed to revolutionize how content creators, journalists, and bloggers transform their written content into engaging social media videos. The platform addresses a critical gap in the content creation workflow: the ability to quickly convert articles and ideas into professional-quality vertical videos optimized for Instagram Reels, TikTok, and other short-form video platforms.

The motivation behind Thoxt Reels stems from the growing demand for video content in digital media. Written content, while valuable, often reaches limited audiences compared to video. However, creating professional videos requires significant time, technical expertise, and expensive software. Thoxt Reels democratizes this process by providing an all-in-one solution that combines AI-powered script generation, professional recording tools, and Instagram-quality editing capabilities.

## Setup Instructions for Evaluators and Users

### Running Locally (VS Code or Any IDE)

**1. Clone/Download the Project**
```bash
git clone <repository-url>
cd thoxt-reels
```

**2. Install Python Dependencies**
```bash
pip install flask flask-cors openai python-dotenv requests
```

**3. Set Up OpenAI API Key**

Create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-your-actual-key-here
PORT=5000
```

**Important:** Add `.env` to `.gitignore` to protect your API key:
```bash
echo ".env" >> .gitignore
```

**4. Run the Application**
```bash
python app.py
```

**5. Open Your Browser**
```
http://localhost:5000
```

### Alternative: VS Code Terminal Method

Set environment variable directly in terminal before running:

**Mac/Linux:**
```bash
export OPENAI_API_KEY="sk-your-key-here"
python app.py
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
python app.py
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=sk-your-key-here
python app.py
```

## Requirements

- **Python 3.11+** - Download from python.org
- **Node.js 18+** (optional, only for npm workflow wrapper)
- **Modern Browser** - Chrome, Firefox, Safari, or Edge
- **Camera Access** - Required for video recording features
- **OpenAI API Key** - For AI script generation feature only

**Note:** The AI Script Generator uses `gpt-4o-mini`, which costs approximately $0.15 per 1M input tokens and $0.60 per 1M output tokens. Testing the feature uses minimal tokens and costs very little.

## Quick Test Checklist for Evaluators

### AI Script Generation
1. Navigate to "AI Teleprompter" from main menu
2. Enter a topic (e.g., "healthy eating tips")
3. Select duration: 15, 30, or 60 seconds
4. Choose tone: engaging, professional, casual, or educational
5. Click "Generate Script"
6. Verify script generates without errors

### Video Recording
1. Click "Create New Reel" from main menu
2. Grant camera permissions when prompted
3. Record a short video (5-10 seconds)
4. Click stop button
5. Verify recording preview appears

### Teleprompter Feature
1. Generate a script using AI Teleprompter
2. Click "Use This Script" button
3. Verify teleprompter opens in recorder
4. Click record and observe word-by-word highlighting
5. Verify yellow highlight moves through text at ~150 words/minute

### Instagram-Style Editing Features
1. In recorder, test the vertical sidebar sections:
   - **TEXT**: Add custom text overlays with font/color options
   - **STICKER**: Add emoji stickers and drag to position
   - **FILTER**: Apply Instagram filters (Valencia, Nashville, etc.)
   - **MUSIC**: Background audio controls (UI ready)
   - **MIRROR**: Toggle mirror mode for selfie recording

2. Test camera controls:
   - Click camera flip button (⟲) to switch front/back camera
   - Verify portrait orientation (1080x1920)

### Save and Playback
1. After recording, enter a title for your reel
2. Click "Save Reel"
3. Navigate to "My Reels" from main menu
4. Verify video appears in gallery
5. Click play and confirm audio works
6. Test Edit and Download buttons

### Mobile Responsiveness
1. Open application on mobile device or resize browser to mobile width
2. Verify fullscreen recorder interface
3. Test touch controls and gestures
4. Verify portrait video orientation

## Features Overview

### Core Features

**1. AI-Powered Script Generation**
- Uses OpenAI GPT-4o-mini for professional script writing
- Customizable duration (15/30/60 seconds)
- Multiple tone options (engaging, professional, casual, educational)
- Instant generation with clean, emoji-free output

**2. Professional Recording Studio**
- Portrait orientation: 1080x1920 pixels (Instagram/TikTok optimized)
- Front and back camera support with flip button
- Real-time preview with mirror mode
- Touch-optimized controls for mobile devices

**3. Smart Teleprompter**
- Word-by-word highlighting at 150 words/minute
- Auto-scroll to keep current word centered
- High-contrast, large font for easy reading
- Seamless integration with AI-generated scripts

**4. Instagram-Quality Filters**
- 8 professional filters: Valencia, Nashville, Toaster, Walden, Lo-Fi, Clarendon, Gingham, Black & White
- Real-time filter preview
- Baked into recorded video

**5. Advanced Overlay System**
- Draggable text overlays with custom fonts and colors
- Emoji stickers with resizable placement
- Multi-touch support for mobile (drag and pinch-to-zoom)
- All overlays recorded into final video

**6. Local Storage**
- Videos stored in browser IndexedDB
- Thumbnail auto-generation
- Offline access to saved reels
- Download to device functionality

## Security and Privacy

**IMPORTANT: Never share your personal OpenAI API key publicly.**

- Each user must use their own OpenAI API key
- Keys are stored securely in environment variables
- Videos are stored locally in browser (not on server)
- No external data transmission except OpenAI API calls
- Use `.gitignore` to prevent committing sensitive files

## Integration with Thoxt Website

Thoxt Reels is designed as a standalone web application that integrates seamlessly with the broader Thoxt content ecosystem. The platform serves as a content transformation hub where:

1. **Article Conversion**: Journalists and bloggers can paste article URLs or custom topics to generate video scripts automatically
2. **AI Script Generation**: Leverages OpenAI's GPT-4 model to create engaging, platform-optimized scripts based on topic, desired duration, and tone
3. **Professional Recording**: Provides a teleprompter-equipped recording studio with portrait orientation support for mobile-first content
4. **Advanced Editing**: Offers Instagram-quality filters, text overlays, stickers, and audio mixing capabilities
5. **Social Media Export**: Enables direct export to social platforms with optimized formats and resolutions

The application runs as a Python Flask backend with a vanilla JavaScript frontend, ensuring fast performance and easy deployment within the existing Thoxt infrastructure.

## Technical Architecture

### Backend Infrastructure

**app.py** - The core Flask application server that handles all backend operations. This file contains API routes for reel management, script generation, and database operations. It serves HTML templates using Jinja2 and manages CORS policies for cross-origin requests. The server runs on port 5000 and includes routes for:
- Creating, retrieving, updating, and deleting video reels
- AI script generation with OpenAI integration
- View and like tracking for engagement metrics
- Static file serving for CSS, JavaScript, and media assets

**reels.db** - SQLite database file storing all application data including reel metadata, user information, engagement statistics, and timestamps. The schema includes tables for reels with fields like id, title, duration, thumbnail paths, view counts, and creation timestamps.

### Frontend Structure

**templates/base.html** - The master template that defines the common layout structure for all pages. Contains meta tags for mobile optimization, viewport settings, and links to stylesheets. All other HTML templates extend this base to maintain consistent navigation and styling across the application.

**templates/index.html** - The landing page and options menu that serves as the main navigation hub. Features card-based navigation to key sections: My Reels, Create New Reel, and AI Teleprompter. Includes professional styling with gradient borders and touch-optimized buttons for mobile devices.

**templates/recorder.html** - The primary recording interface featuring portrait camera support, Instagram-style vertical sidebar, and teleprompter overlay. This page handles video capture using MediaRecorder API, manages camera permissions, and coordinates between various recording modes including mirror effects and filter applications. The sidebar includes five sections: TEXT (custom overlays), STICKER (emoji elements), FILTER (Instagram-quality effects), MUSIC (audio tracks), and MIRROR (flip mode).

**templates/ai-script.html** - The AI-powered script generation interface where users input topics, select video duration (15/30/60 seconds), and choose tone (engaging, professional, casual, educational). Integrates with OpenAI API to generate optimized video scripts that are stored in sessionStorage and transferred to the teleprompter.

**templates/saved-reels.html** - Gallery view displaying all recorded reels with playback controls, metadata display, and edit/delete options. Features responsive grid layout, thumbnail previews, and duration indicators. Provides navigation to the advanced editor for post-production enhancements.

**templates/editor.html** - Professional video editing interface with advanced tools including filter application with before/after comparison, text overlay system with custom fonts and animations, music library integration, sticker placement, drawing tools, and AI-powered transcript generation capabilities. Uses dual-layer video system for real-time preview of edits.

### JavaScript Modules

**static/js/recorder.js** - Handles all recording functionality including camera initialization with portrait constraints (1080x1920), MediaRecorder setup, canvas-based recording for filters and mirror effects, overlay management, and teleprompter word highlighting. Contains critical functions:
- `initCamera()`: Requests camera access with portrait orientation
- `startRecording()`: Initiates video capture with selected effects
- `stopRecording()`: Finalizes recording and saves to IndexedDB
- `prepareTeleprompter()`: Splits script into highlightable word spans
- `startTeleprompterHighlight()`: Implements 150 words-per-minute highlighting

**static/js/ai-script.js** - Manages AI script generation workflow by collecting user inputs, making API calls to backend endpoints, displaying generated scripts, and handling the transfer of scripts to the teleprompter via sessionStorage.

**static/js/saved-reels.js** - Controls the saved reels gallery, manages IndexedDB operations for video blob retrieval, handles reel playback, and coordinates deletion operations with proper database cleanup.

**static/js/editor.js** - Powers the advanced editing interface with filter preview systems, text overlay positioning, music synchronization, and export functionality.

### Styling System

**static/css/style.css** - Comprehensive stylesheet defining the dark theme aesthetic with yellow accent colors. Contains media queries for responsive design, custom animations for UI elements, Instagram-style filter definitions, teleprompter styling with enhanced readability (large fonts, high line-height), and mobile-optimized layouts. Key sections include:
- Global theme variables and reset styles
- Portrait camera and video container styles
- Sidebar and panel animations
- Filter effect definitions (Valencia, Nashville, Toaster, etc.)
- Teleprompter overlay with word highlighting styles
- Mobile breakpoints for devices under 768px width

## How the System Works

The workflow begins when a user accesses the platform and chooses to create content. For AI-assisted creation, they navigate to the AI Script Generator where they define their video parameters. The system sends a request to the Flask backend, which communicates with OpenAI's API using the stored API key. The generated script is returned, displayed, and made available for teleprompter use.

When recording begins, the application requests camera access with specific portrait constraints. The MediaRecorder API captures video while the canvas system optionally applies real-time effects like mirror transforms and color filters. If the teleprompter is active, words highlight sequentially at a reading-friendly pace, scrolling automatically to keep the current word visible.

Recorded videos are stored locally in IndexedDB as binary blobs with associated metadata saved to the SQLite database. Users can review their reels in the gallery, where clicking edit opens the advanced editor. The editor loads the video blob and provides professional tools for enhancement. Final videos can be downloaded or exported directly to social media platforms.

The entire system is optimized for mobile devices with touch controls, gesture navigation, and responsive layouts that adapt from desktop monitors to smartphone screens. Portrait orientation is enforced for Instagram-compatible output, and all features work seamlessly across device types.

## Troubleshooting

**Camera not working:**
- Ensure browser has camera permissions
- Try HTTPS connection (required for camera access)
- Check if another app is using the camera

**AI Script Generator errors:**
- Verify OpenAI API key is set correctly
- Check API key has sufficient credits
- Ensure internet connection is active

**Videos not saving:**
- Check browser supports IndexedDB
- Ensure sufficient storage space
- Try clearing browser cache

**Port 5000 already in use:**
- Change PORT in .env file to another port (e.g., 8000)
- Or stop other applications using port 5000

## Future Development

The platform is designed for extensibility with planned features including cloud storage integration, collaborative editing, advanced AI capabilities for auto-captioning and scene detection, and direct social media API integration for one-click publishing. The modular architecture ensures that new features can be added without disrupting existing functionality.

## License and Credits

Built with Flask, OpenAI GPT-4o-mini, and modern web technologies. Designed for content creators, journalists, and social media enthusiasts.
