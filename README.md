# Lab Activity #1: Building Your First System Integration

## 1. Objective
This laboratory activity demonstrates system integration by connecting a Node.js API gateway to a Python data-processing worker using HTTP/REST communication. The implementation shows key integration principles including API communication, data serialization, loosely coupled services, orchestration, and error handling.

## 2. Background / Theoretical Framework
System integration is the process of linking separate systems so they can share data and functionality as a coordinated whole. In this lab, Node.js acts as the API gateway and Python acts as the processing service. They communicate through REST endpoints using JSON payloads.

## 3. Setup and Installation
### Prerequisites
- Node.js v18+
- npm
- Python 3.8+
- Flask
- VS Code (recommended)

### Install dependencies
```bash
cd integration-basics/nodejs-service
npm install

cd ../python-service
pip install flask
```

## 4. System Architecture Design
The solution contains two services:
- Node.js gateway: receives client requests, forwards them to Python, and aggregates the response
- Python worker: performs the calculation logic

### Architecture Flow
Client -> Node.js Gateway -> Python Service -> Response back to client

## 5. Step-by-Step Implementation
### Python Service
The Python worker is implemented in [python-service/app.py](python-service/app.py). It exposes:
- POST /calculate
- GET /ping

Supported operations:
- add
- subtract
- multiply
- divide
- modulo
- power
- square_root

### Node.js Service
The Node.js API gateway is implemented in [nodejs-service/server.js](nodejs-service/server.js). It exposes:
- GET /hello
- POST /api/calculate
- GET /api/status
- GET /api/history

This API forwards requests to the Python service, logs calculation history to CSV, and returns an enriched response to the client.
The calculator displays the saved calculations from `nodejs-service/history.csv`
below the keypad and refreshes the list after each successful calculation.

## 6. Troubleshooting Guide
Common issues include:
- PowerShell execution policy blocking `npm` scripts on some Windows systems
- JSON escaping issues in CMD
- Python service not running on port 5001
- Node.js service not running on port 3000

If `node server.js` reports that port 3000 is already in use, the gateway may
already be running. Check `http://localhost:3000/hello` before starting another
instance. To use a different port, set `PORT` before starting the service (for
example, in PowerShell: `$env:PORT = 3001; node server.js`).

### Suggested Windows request format
Use PowerShell instead of CMD when sending JSON requests:
```powershell
$headers = @{ 'Content-Type' = 'application/json' }
$body = @{ num1 = 15; num2 = 5; operation = 'multiply' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/calculate' -Headers $headers -Body $body
```

## 7. Code Documentation
### Python Service
- calculate(): processes arithmetic requests and returns JSON results
- ping(): health-check endpoint

### Node.js Service
- /hello: basic gateway hello endpoint
- /api/calculate: receives client requests and forwards to Python
- /api/status: checks if both services are running
- /api/history: returns recent calculation records

## 8. Testing and Validation
Validated with real end-to-end requests:
- Node health check returned `Node.js is running` and Python status `Python is running!`
- Calculation request returned a successful aggregated result

### Validation evidence
The Node tests were executed successfully with the following result:
- Pass: 3
- Fail: 0

## 9. Key Learnings and Observations
| Concept | How It Was Implemented | Why It Matters |
|---|---|---|
| Loose Coupling | Node.js and Python communicate only through HTTP APIs | Enables independent development and updates |
| RESTful Communication | HTTP methods such as POST and GET with JSON payloads | Standardizes service interaction |
| API Gateway Pattern | Node.js receives requests and routes to Python | Centralizes orchestration and request handling |
| Orchestration | The gateway controls the request flow and aggregates results | Makes multi-service workflows manageable |
| Error Handling | Validation for division by zero and unreachable services | Improves resilience in distributed systems |

## 10. Conclusion and Next Steps
This integration lab successfully demonstrates an API gateway pattern using Node.js and Python. The system is loosely coupled, uses REST communication, logs calculation history, and handles errors gracefully. The next improvement steps could include adding more advanced operations, monitoring dashboards, secure authentication, or a persistent database for historical records.

## Extra Features Included
- Additional operations: modulo, power, square_root
- History logging to CSV
- HTML user interface at [index.html](index.html)

## Run the Project
### Terminal 1: Python
```bash
cd integration-basics/python-service
python app.py
```

### Terminal 2: Node.js
```bash
cd integration-basics/nodejs-service
node server.js
```

### Terminal 3: Open browser
Open `http://localhost:3000` in a browser to use the calculator. The Node.js
gateway serves the page so browser requests to the API use the same origin.
Opening [index.html](index.html) directly as a `file://` page may be blocked by
browser security when it calls the gateway. REST requests can also be sent
through [test.http](test.http).
