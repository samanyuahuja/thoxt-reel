# Overview

Thoxt Reels is an AI-powered video creation platform built as a full-stack web application. It serves as a social media platform with a focus on creating engaging video content (reels) using artificial intelligence for script generation and professional editing tools. The platform targets journalists, bloggers, and content creators who want to transform written articles or custom topics into compelling video content.

The application provides a comprehensive suite of features including AI-assisted script generation from existing articles or custom topics, a professional video recording interface with teleprompter functionality, smart editing tools with auto-captioning and noise reduction, and seamless export options for social media platforms.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built using React 18 with TypeScript, utilizing Vite as the build tool for fast development and optimized production builds. The UI framework is based on Radix UI primitives with shadcn/ui components, styled using Tailwind CSS with a custom dark theme featuring a signature yellow accent color (`--thoxt-yellow: hsl(45, 100%, 51%)`).

State management is handled through TanStack Query (React Query) for server state management and caching, with local component state managed via React hooks. The routing system uses Wouter for lightweight client-side navigation.

Key frontend architectural decisions:
- **Component Architecture**: Modular component structure with reusable UI components in `/components/ui/`
- **Styling System**: CSS-in-JS approach using Tailwind CSS with CSS custom properties for theming
- **Type Safety**: Full TypeScript integration with strict compiler options
- **Performance**: Code splitting and lazy loading capabilities through Vite

## Backend Architecture

The server-side follows a Node.js Express.js architecture with TypeScript support. The application uses an ESM module system and runs on a single-server deployment model with development and production configurations.

Database architecture utilizes PostgreSQL with Drizzle ORM for type-safe database operations and schema management. The database schema includes tables for users, articles, reels, and script generation requests with proper foreign key relationships.

API structure follows RESTful conventions with endpoints for:
- Article management (`/api/articles`)
- Script generation (`/api/generate-script`)
- File upload and media processing capabilities

Key backend architectural decisions:
- **ORM Choice**: Drizzle ORM selected for type safety and performance over traditional ORMs
- **Database**: PostgreSQL chosen for ACID compliance and advanced features
- **API Design**: RESTful API architecture with JSON responses
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions

The application uses a hybrid storage approach:
- **Primary Database**: PostgreSQL via Neon Database (serverless PostgreSQL)
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **Media Storage**: Google Cloud Storage integration for video and image assets
- **File Processing**: Client-side video processing capabilities with FFmpeg.wasm

Database schema design includes:
- Users table with authentication fields
- Articles table for source content with metadata
- Reels table linking videos to source articles with processing metadata
- Script generation requests table for AI workflow tracking

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