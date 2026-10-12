function evaluateExpression(num1, num2, operation) {
  const a = Number(num1);
  const b = Number(num2);

  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      if (b === 0) return 'Error: Division by zero';
      return a / b;
    case 'modulo':
      if (b === 0) return 'Error: Division by zero';
      return a % b;
    case 'power':
      return a ** b;
    case 'square_root':
      if (a < 0) return 'Error: Invalid input for square root';
      return Math.sqrt(a);
    default:
      return 'Invalid operation';
  }
}

module.exports = { evaluateExpression };
