# Airport API

A comprehensive REST API for airport data built with NestJS, TypeORM, Redis caching, and API key authentication. The API provides access to airport information including codes, names, locations, and more based on the OpenFlights database.

## Features

- **Complete Airport Database**: Access to 13,000+ airports worldwide
- **Multiple Search Options**: Search by name, city, country, IATA/ICAO codes
- **Redis Caching**: Fast response times with intelligent caching
- **API Key Authentication**: Secure access control
- **SQLite Database**: Lightweight, embedded database
- **RESTful Design**: Clean, intuitive API endpoints
- **Data Import**: Automatic import from OpenFlights data source
- **AI-Powered Filtering**: Uses OpenAI to identify main airports in each city

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Redis server
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd escape-radar-airport-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_TYPE=sqlite
DATABASE_NAME=airports.db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
API_PORT=3000
AIRPORTS_DATA_URL=https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
VALID_API_KEYS=your-api-key-1,your-api-key-2,your-api-key-3
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

4. Start Redis server:
```bash
redis-server
```

5. Run the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

All endpoints require authentication via API key. Include your API key in the request header:
```
X-API-Key: your-api-key
```

Or as a query parameter:
```
?apiKey=your-api-key
```

### Airport Search

#### Search Airports
```
GET /airports/search
```

Query parameters:
- `search` - General search across name, city, country, IATA, ICAO
- `country` - Filter by country name
- `city` - Filter by city name
- `iata` - Exact IATA code match
- `icao` - Exact ICAO code match
- `limit` - Number of results (default: 50, max: 1000)
- `offset` - Pagination offset (default: 0)

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/search?search=london&limit=10"
```

#### Search Main Airports (AI-Filtered)
```
GET /airports/search/main
```

Returns only the main airport for each city using AI filtering. Same query parameters as regular search.

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/search/main?search=london"
```

#### Get Main Airport for City
```
GET /airports/main-airport/:city
```

Returns the main airport for a specific city using AI analysis.

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/main-airport/London"
```

#### Get Airport by ID
```
GET /airports/id/:id
```

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/id/507"
```

#### Get Airport by IATA Code
```
GET /airports/iata/:iata
```

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/iata/JFK"
```

#### Get Airport by ICAO Code
```
GET /airports/icao/:icao
```

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/icao/KJFK"
```

#### Get Airports by Country
```
GET /airports/country/:country
```

Query parameters:
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

Example:
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/airports/country/United%20States?limit=20"
```

#### Get Statistics
```
GET /airports/stats
```

Returns database statistics including total airports, countries, and more.

### Admin Endpoints

#### Import Airport Data
```
POST /admin/import-data
```

Imports fresh airport data from the OpenFlights source and clears cache.

#### Clear Cache
```
DELETE /admin/cache
```

Clears all Redis cache entries.

## Response Format

### Airport Object
```json
{
  "id": 507,
  "name": "London Heathrow Airport",
  "city": "London",
  "country": "United Kingdom",
  "iata": "LHR",
  "icao": "EGLL",
  "latitude": 51.4706,
  "longitude": -0.461941,
  "altitude": 83,
  "timezone": 0,
  "dst": "E",
  "tz": "Europe/London",
  "type": "airport",
  "source": "OurAirports"
}
```

### Search Response
```json
{
  "airports": [
    // Array of airport objects
  ],
  "total": 1234,
  "limit": 50,
  "offset": 0
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_TYPE` | Database type | `sqlite` |
| `DATABASE_NAME` | Database file name | `airports.db` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | `` |
| `API_PORT` | API server port | `3000` |
| `AIRPORTS_DATA_URL` | OpenFlights data URL | OpenFlights URL |
| `VALID_API_KEYS` | Comma-separated API keys | `default-api-key` |
| `OPENAI_API_KEY` | OpenAI API key for AI filtering | `` |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |

### Caching Strategy

- Search results: 5 minutes TTL
- Individual airports: 10 minutes TTL
- Statistics: 1 hour TTL
- Country listings: 5 minutes TTL

## Development

### Project Structure
```
src/
├── config/           # Configuration files
├── controllers/      # API controllers
├── dto/             # Data transfer objects
├── entities/        # TypeORM entities
├── guards/          # Authentication guards
├── services/        # Business logic services
└── main.ts          # Application entry point
```

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Data Source

This API uses airport data from [OpenFlights](https://openflights.org/data.html), which provides comprehensive information about airports worldwide. The data includes:

- Airport names and locations
- IATA and ICAO codes
- Geographic coordinates
- Timezone information
- And more...

## License

This project is licensed under the MIT License.
