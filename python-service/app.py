from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/calculate', methods=['POST'])
def calculate():
    """
    API Endpoint: /calculate
    Method: POST
    Input: JSON with num1, num2, and operation
    Output: JSON with calculation result
    """
    data = request.get_json(silent=True) or {}
    num1 = data.get('num1', 0)
    num2 = data.get('num2', 0)
    operation = data.get('operation', 'add')

    if operation == 'add':
        result = num1 + num2
    elif operation == 'subtract':
        result = num1 - num2
    elif operation == 'multiply':
        result = num1 * num2
    elif operation == 'divide':
        if num2 == 0:
            result = 'Error: Division by zero'
        else:
            result = num1 / num2
    elif operation == 'modulo':
        if num2 == 0:
            result = 'Error: Division by zero'
        else:
            result = num1 % num2
    elif operation == 'power':
        result = num1 ** num2
    elif operation == 'square_root':
        if num1 < 0:
            result = 'Error: Invalid input for square root'
        else:
            result = num1 ** 0.5
    else:
        result = 'Invalid operation'

    return jsonify({
        'status': 'success',
        'input': data,
        'result': result,
        'message': 'Python processed your request!'
    })


@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'Python is running!'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
