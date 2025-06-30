# CraftMyself API

A Node.js/Express/TypeScript API for fitness and nutrition tracking.

## Overview

This API has been converted from Google Cloud Functions to a standalone Node.js Express application. It provides endpoints for:

- Exercise management
- Workout tracking
- Macro/nutrition tracking
- User summaries and analytics
- Data export functionality

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database (when implemented)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

   For development with auto-rebuild:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Exercises
- `GET /exercises` - Get all exercises
- `GET /exercises/prs/user/:userId` - Get user's personal records

### Workouts
- `GET /workouts/user/:userId` - Get user workouts
- `POST /workouts` - Create a workout
- `PUT /workouts/:workoutId` - Update a workout
- `DELETE /workouts/:workoutId` - Delete a workout
- `GET /workouts/history/user/:userId` - Get workout history

### Macros
- `GET /macros/user/:userId` - Get user macros
- `POST /macros` - Add macros
- `PUT /macros/:macroId` - Update macros
- `DELETE /macros/:macroId` - Delete macros
- `GET /macros/history/user/:userId` - Get macro history

### Summary
- `GET /summary/weekly/user/:userId` - Get weekly summary
- `GET /summary/analysis/user/:userId` - Get comprehensive analysis

### User
- `GET /user/:userId` - Get user data

### Export
- `GET /export/exercises` - Export exercises data

## Architecture

- **Framework**: Express.js with TypeScript
- **Dependency Injection**: Inversify
- **Database**: PostgreSQL (to be implemented)
- **Authentication**: JWT-based (to be implemented)

## Development Status

### ✅ Completed
- Converted from Cloud Functions to Express API
- Removed Firebase/Firestore dependencies (commented out)
- Updated dependency injection configuration
- Created PostgreSQL repository interface
- Updated all controllers and services

### 🚧 TODO
- Implement PostgreSQL database connection and queries
- Implement JWT-based authentication
- Add environment variable configuration
- Add proper error handling middleware
- Add request validation
- Add logging middleware
- Add rate limiting
- Add API documentation (Swagger/OpenAPI)
- Add unit and integration tests

## Project Structure

```
├── src/
│   ├── config/           # Dependency injection and configuration
│   ├── controllers/      # API route controllers
│   ├── domain/
│   │   ├── models/       # Data models
│   │   ├── prompts/      # AI prompts
│   │   └── services/     # Business logic services
│   ├── middlewares/      # Express middlewares
│   └── repository/       # Data access layer
├── server.ts             # Main server entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Ensure TypeScript compiles without errors: `npm run build`
2. Follow the existing code style and patterns
3. Update this README if you add new features or endpoints