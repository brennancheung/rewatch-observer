# Rewatch Observer - Architecture Document

## Overview

Rewatch Observer is a unified observability platform built as a single Next.js application that serves three core functions:

1. **API Server** - Receives log events from external sources (like mcp-rewatch)
2. **Web UI** - Provides a user-friendly interface to view and analyze logs
3. **Log Multiplexer** - Outputs all received logs to stdout for terminal visibility

## System Architecture

```
┌─────────────────┐         ┌──────────────────────────┐
│   mcp-rewatch   │         │    Rewatch Observer      │
│  (or other      │  HTTP/  │    (Next.js App)         │
│   log sources)  │  WebSocket │                      │
│                 ├────────►│  ┌──────────────────┐   │
└─────────────────┘         │  │   API Endpoints  │   │
                            │  │  - POST /api/logs│   │
┌─────────────────┐         │  │  - WS /api/stream│   │
│  Other Source   │         │  └────────┬─────────┘   │
│                 ├────────►│           │             │
└─────────────────┘         │  ┌────────▼─────────┐   │
                            │  │   Log Storage    │   │
                            │  │  (In-Memory)     │   │
                            │  └────────┬─────────┘   │
                            │           │             │
                            │  ┌────────▼─────────┐   │
                            │  │    Web UI        │   │
                            │  │  (React/Next.js) │   │
                            │  └──────────────────┘   │
                            │           │             │
                            │  ┌────────▼─────────┐   │
                            │  │  Stdout Multiplexer│  │
                            │  │  console.log()    │   │
                            │  └──────────────────┘   │
                            └──────────────────────────┘
                                        │
                                        ▼
                                    Terminal
```

## Core Components

### 1. API Server
- **Purpose**: Accept incoming log events from external sources
- **Endpoints**:
  - `POST /api/logs` - Receive batch log events
  - `WebSocket /api/stream` - Real-time log streaming
- **Data Format**: JSON payloads containing:
  ```typescript
  {
    source: string,      // e.g., "mcp-rewatch"
    timestamp: string,   // ISO 8601
    level: string,       // "info" | "error" | "warn" | "debug"
    message: string,     // Log content
    metadata?: object    // Additional context
  }
  ```

### 2. Web UI
- **Purpose**: Display logs in a user-friendly interface
- **Features**:
  - Real-time log streaming view
  - Filter by source, level, or search terms
  - Timestamp formatting
  - Color-coded log levels
  - Collapsible metadata views
  - Auto-scroll with pause capability

### 3. Log Multiplexer
- **Purpose**: Output all received logs to stdout
- **Format**: Structured output for terminal readability
- **Example**:
  ```
  [2025-01-03T10:15:30.123Z] [mcp-rewatch] [info] Process started: npm run dev
  [2025-01-03T10:15:31.456Z] [mcp-rewatch] [error] Build failed: Module not found
  ```

## Technical Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **UI**: React 18+, shadcn
- **Styling**: Tailwind CSS
- **Real-time**: Native WebSocket API
- **State Management**: React hooks (useState, useEffect)
- **Log Storage**: In-memory buffer

## Key Design Decisions

### 1. Single Application Architecture
- Simplifies deployment and maintenance
- No separate backend/frontend coordination
- Unified codebase for all functionality

### 2. In-Memory Log Storage
- Fast access for real-time display
- Configurable buffer size (e.g., 10,000 logs)
- No persistence (logs are ephemeral)

### 3. WebSocket for Real-time Updates
- Efficient for continuous log streaming
- Low latency for UI updates
- Fallback to polling if needed

### 4. Stdout Multiplexing
- Maintains terminal visibility
- Useful for debugging and monitoring
- Structured format for parseability
- Use color to separate multiplexed services into a single output.
- Slight delay / debounce of logs so we can group logs together in the output to minimize mixing (200ms)

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up Next.js project with TypeScript, pnpm, eslint, shadcn
- Create basic API endpoints
- Implement in-memory log storage
- Set up stdout multiplexer

### Phase 2: Web UI
- Build log viewer component
- Implement real-time updates
- Add filtering and search
- Style with Tailwind CSS

### Phase 3: Integration & Testing
- Test with mock log sources
- Ensure performance with high log volumes
- Add error handling and recovery

### Phase 4: Enhancement (Future)
- Log persistence options
- Analytics and metrics
- Alert capabilities
- Multiple UI themes
