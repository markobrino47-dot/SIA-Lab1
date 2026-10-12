const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PYTHON_URL = process.env.PYTHON_URL || 'http://localhost:5001';
const CALCULATOR_FILE = path.join(__dirname, '..', 'index.html');
const HISTORY_FILE = path.join(__dirname, 'history.csv');
const SUPPORTED_OPERATIONS = new Set([
  'add',
  'subtract',
  'multiply',
  'divide',
  'modulo',
  'power',
  'square_root'
]);

function normalizeNumber(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsed;
}

function normalizeCalculationRequest(body) {
  const request = body && typeof body === 'object' ? body : {};
  const operation = typeof request.operation === 'string' ? request.operation.toLowerCase() : '';

  if (!SUPPORTED_OPERATIONS.has(operation)) {
    throw new Error('Unsupported operation');
  }

  const num1 = normalizeNumber(request.num1, 'num1');
  const num2 = operation === 'square_root' ? 0 : normalizeNumber(request.num2, 'num2');

  return { num1, num2, operation };
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseHistory(fileContents) {
  const recordStart = /(?=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z,)/;

  return fileContents
    .split(recordStart)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [timestamp, num1, num2, operation, ...resultParts] = parseCsvLine(line);
      return {
        timestamp,
        num1,
        num2,
        operation,
        result: resultParts.join(',')
      };
    });
}

function logCalculation(entry) {
  const timestamp = new Date().toISOString();
  const values = [
    timestamp,
    entry.num1,
    entry.num2,
    entry.operation,
    typeof entry.result === 'string' ? entry.result : String(entry.result ?? '')
  ];
  const line = `${values.map(escapeCsvValue).join(',')}\n`;
  fs.appendFileSync(HISTORY_FILE, line, 'utf8');
}

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js Gateway!' });
});

app.get('/', (req, res) => {
  res.sendFile(CALCULATOR_FILE);
});

app.post('/api/calculate', async (req, res) => {
  console.log('Node.js received:', req.body);

  try {
    const normalizedRequest = normalizeCalculationRequest(req.body);
    const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, normalizedRequest);

    const responsePayload = {
      gateway_message: 'Node.js successfully aggregated the data!',
      python_result: pythonResponse.data
    };

    logCalculation({
      num1: normalizedRequest.num1,
      num2: normalizedRequest.num2,
      operation: normalizedRequest.operation,
      result: pythonResponse.data && pythonResponse.data.result
    });

    res.json(responsePayload);
  } catch (error) {
    const message = error && error.response && error.response.data && error.response.data.error
      ? error.response.data.error
      : error.message || 'Calculation failed';

    console.error('Error:', message);

    if (error && error.response && error.response.status === 400) {
      return res.status(400).json({ error: message });
    }

    res.status(500).json({
      error: 'Failed to reach Python service. Is it running on port 5001?'
    });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const ping = await axios.get(`${PYTHON_URL}/ping`);
    const pythonStatus = ping.data && typeof ping.data === 'object' ? ping.data.status : ping.data;

    res.json({
      gateway: 'Node.js is running',
      python: pythonStatus || 'Python is running!'
    });
  } catch (error) {
    res.status(500).json({
      gateway: 'Node.js is running',
      python: 'Python is NOT reachable'
    });
  }
});

app.get('/api/history', (req, res) => {
  if (!fs.existsSync(HISTORY_FILE)) {
    return res.json({ history: [] });
  }

  const fileContents = fs.readFileSync(HISTORY_FILE, 'utf8');
  res.json({ history: parseHistory(fileContents) });
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Node.js Gateway: http://localhost:${PORT}`);
    console.log(`Python URL: ${PYTHON_URL}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. The gateway may already be running at ` +
        `http://localhost:${PORT}/hello. Stop the other process or set a different PORT.`
      );
    } else {
      console.error('Failed to start Node.js Gateway:', error);
    }
    process.exitCode = 1;
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, normalizeCalculationRequest, parseCsvLine, parseHistory, logCalculation };
