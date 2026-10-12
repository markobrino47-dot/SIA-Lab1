const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');
const { app, parseHistory } = require('./server');

test('parses history records from CSV, including adjacent records without a newline', () => {
  const history = parseHistory(
    '2026-10-12T01:00:00.000Z,9,0,square_root,3' +
    '2026-10-12T01:01:00.000Z,9,0,divide,"Error: Division by zero"'
  );

  assert.deepEqual(history, [
    {
      timestamp: '2026-10-12T01:00:00.000Z',
      num1: '9',
      num2: '0',
      operation: 'square_root',
      result: '3'
    },
    {
      timestamp: '2026-10-12T01:01:00.000Z',
      num1: '9',
      num2: '0',
      operation: 'divide',
      result: 'Error: Division by zero'
    }
  ]);
});

test('serves the calculator page for same-origin browser requests', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const { port } = server.address();
    const page = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/`, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body }));
      }).on('error', reject);
    });

    assert.equal(page.status, 200);
    assert.match(page.body, /Calculator \| Integration Lab/);
    assert.match(page.body, /fetch\('\/api\/calculate'/);
    assert.match(page.body, /fetch\('\/api\/history'/);
    assert.match(page.body, /Calculation history/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('reports a clear message when its configured port is occupied', async () => {
  const blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(0, resolve);
  });

  try {
    const { port } = blocker.address();
    const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      cwd: __dirname,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk; });

    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });

    assert.equal(exitCode, 1);
    assert.match(output, new RegExp(`Port ${port} is already in use`));
    assert.match(output, /gateway may already be running/);
    assert.doesNotMatch(output, /Unhandled 'error' event/);
  } finally {
    await new Promise((resolve, reject) => {
      blocker.close((error) => error ? reject(error) : resolve());
    });
  }
});
