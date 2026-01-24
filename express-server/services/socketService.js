// services/socketService.js
const net = require('net');

const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 8080;
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || '127.0.0.1';

/**
 * Send command to C++ server and receive response
 * @param {string} command - Command to send 
 * @returns {Promise<string>} - Response from C++ server
 */
function sendToCppEngine(command) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(5000); // 5 second timeout

        client.connect(CPP_SERVER_PORT, CPP_SERVER_HOST, () => {
            client.write(command + '\n');
        });

        let responseData = '';

        client.on('data', (data) => {
            responseData += data.toString();
            // Check if we received complete response
            client.destroy();
            resolve(responseData.trim());
        });

        client.on('error', (err) => {
            console.error('C++ server connection error:', err.message);
            reject(new Error(`C++ server error: ${err.message}`));
        });

        client.on('timeout', () => {
            console.error('C++ server connection timeout');
            client.destroy();
            reject(new Error('C++ server timeout'));
        });

        client.on('close', () => {
            // Connection closed
        });
    });
}

module.exports = { sendToCppEngine };