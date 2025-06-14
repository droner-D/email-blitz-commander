
# SMTP Load Tester Backend

A powerful Node.js/TypeScript backend for SMTP load testing with real-time monitoring and comprehensive analytics.

## Features

- **High-Performance SMTP Testing**: Multi-threaded email sending with configurable concurrency
- **Real-time Monitoring**: WebSocket-based live updates during test execution
- **Comprehensive Analytics**: Detailed performance metrics and response time analysis
- **Database Storage**: SQLite-based storage for test configurations and results
- **File Upload Support**: Recipient lists and email attachments
- **RESTful API**: Complete API for frontend integration
- **Error Handling**: Robust error tracking and SMTP response logging
- **Graceful Shutdown**: Clean test termination and resource cleanup

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/smtp_tester.db
MAX_CONCURRENT_TESTS=10
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
```

## Development

Start the development server with auto-reload:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Configuration Management
- `GET /api/configs` - Get all SMTP configurations
- `POST /api/configs` - Save SMTP configuration

### Test Management
- `POST /api/tests/start` - Start a load test
- `POST /api/tests/:testId/stop` - Stop a running test
- `POST /api/tests/:testId/pause` - Pause a running test
- `POST /api/tests/:testId/resume` - Resume a paused test
- `GET /api/tests/active` - Get all active tests

### Results & Analytics
- `GET /api/tests/results` - Get test history
- `GET /api/tests/:testId/result` - Get specific test result

### File Upload
- `POST /api/upload/recipients` - Upload recipient list file
- `POST /api/upload/attachment` - Upload email attachment

### Health Check
- `GET /health` - Server health status

## WebSocket Events

### Client → Server
- `joinTestRoom` - Join a test room for real-time updates
- `leaveTestRoom` - Leave a test room

### Server → Client
- `testStart` - Test has started
- `testProgress` - Real-time test progress updates
- `testComplete` - Test has completed
- `testError` - Error occurred during testing
- `testPause` - Test has been paused
- `testResume` - Test has been resumed

## Architecture

### Core Components

1. **SMTPTester**: Main testing engine with multi-threading support
2. **TestManager**: Manages multiple concurrent tests and WebSocket communication
3. **Database**: SQLite-based persistence layer
4. **API Routes**: RESTful endpoints for frontend integration

### Performance Features

- **Concurrent Threading**: Configurable number of parallel email sending threads
- **Queue Management**: Async queue for managing email sending tasks
- **Response Time Tracking**: Min, max, and average response time calculation
- **Error Handling**: Comprehensive SMTP error tracking and logging
- **Memory Management**: Efficient handling of large recipient lists

### Security

- **Input Validation**: Joi-based request validation
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express.js
- **File Upload Limits**: Configurable file size and type restrictions

## Database Schema

### smtp_configs
- Configuration storage for SMTP servers and test parameters

### test_results
- Comprehensive test results including metrics and error logs

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Reverse Proxy (Nginx)
```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location /socket.io/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Performance Tuning

### High Concurrency Settings
```javascript
// Increase Node.js limits
process.setMaxListeners(0);

// Configure libuv thread pool
process.env.UV_THREADPOOL_SIZE = '128';
```

### Memory Optimization
- Streaming for large recipient lists
- Periodic cleanup of in-memory test data
- Configurable response history limits

## Monitoring

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Winston-based structured logging

### Metrics
- Active test count
- Memory usage
- Response times
- Error rates

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **Real-time Updates**: WebSocket integration for live test monitoring
2. **Type Safety**: Shared TypeScript interfaces
3. **File Handling**: Support for recipient uploads and attachments
4. **Error Handling**: Comprehensive error responses

## Development Notes

- Built with TypeScript for type safety
- Async/await patterns throughout
- Event-driven architecture for test management
- Modular design for easy maintenance and testing
