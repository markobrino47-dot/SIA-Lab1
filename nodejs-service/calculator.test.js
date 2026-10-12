const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateExpression } = require('./calculator');

test('adds two numbers correctly', () => {
  assert.equal(evaluateExpression(10, 5, 'add'), 15);
});

test('divides numbers safely and handles zero division', () => {
  assert.equal(evaluateExpression(20, 5, 'divide'), 4);
  assert.equal(evaluateExpression(20, 0, 'divide'), 'Error: Division by zero');
});

test('supports modulus and power operations', () => {
  assert.equal(evaluateExpression(10, 3, 'modulo'), 1);
  assert.equal(evaluateExpression(2, 5, 'power'), 32);
});
