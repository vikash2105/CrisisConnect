# CrisisConnect Backend

A comprehensive emergency response and community coordination platform with real-time updates.

## Features
- User authentication and authorization
- Incident reporting and management
- Location-based services
- User contribution tracking
- Volunteer coordination
- **Real-time WebSocket updates** 🔴 LIVE

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
  - Body: `fullname, email, phone, password, serviceLocations`
- `POST /api/auth/login` - Login user
  - Body: `email, password`

### Locations
- `GET /api/locations/states` - Get all states
- `GET /api/locations/districts/:state` - Get districts for a state
- `GET /api/locations/cities/:state/:district` - Get cities for a district

### Incidents
- `POST /api/incidents` - Report a new incident (requires auth)
  - Body: `category, description, address, coordinates, media (optional)`
- `GET /api/incidents/nearby` - Get nearby incidents (requires auth)
  - Query: `lat, lng`

### Contributions (All require authentication)
- `GET /api/contributions/reported` - Get incidents reported by user
- `GET /api/contributions/volunteered` - Get incidents where user volunteered
- `GET /api/contributions/stats` - Get user contribution statistics
- `POST /api/contributions/volunteer/:incidentId` - Volunteer for an incident
- `DELETE /api/contributions/volunteer/:incidentId` - Remove volunteer status

### Profile (All require authentication)
- `GET /api/profile` - Get user profile with statistics
- `PUT /api/profile` - Update user profile (name, bio, skills, notifications)

### Volunteer (Alternative incident routes)
- `POST /api/incidents/:id/volunteer` - Volunteer for an incident
- `DELETE /api/incidents/:id/volunteer` - Remove volunteer status

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. Start the server:
   ```bash
   npm start
   ```

## WebSocket Events

The server uses Socket.IO for real-time communication.

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `new-incident` | Incident object | Broadcasted when a new incident is reported |

### Connection
- WebSocket server runs on the same port as HTTP (default: 5000)
- CORS is configured to accept connections from `CLIENT_URL`
- All connected clients receive `new-incident` events in real-time

**Test WebSocket:**
```javascript
// Frontend example
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('new-incident', (incident) => {
  console.log('New incident:', incident);
});
```

## Documentation

For detailed API documentation, see:
- [Contribution API Documentation](./CONTRIBUTION_API.md)
- [Profile & Volunteer API Documentation](./PROFILE_VOLUNTEER_API.md)
- [Developer 3 Complete Guide](../DEVELOPER_3_SUMMARY.md) - WebSocket & Analytics

## Postman Collection

Import `CrisisConnect.postman_collection.json` into Postman to test all endpoints.

Set the following variables in Postman:
- `token` - JWT token from login response
- `incidentId` - ID of an incident to test volunteer endpoints

**Note:** WebSocket events cannot be tested in Postman. Use browser dev tools or a WebSocket client.
