// docs: https://nodejs.org/api/http.html#agentsockets
// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
// https://github.com/ErickWendel/websockets-with-nodejs-from-scratch
//
const http = require('http');
const crypto = require('crypto');

const clients = [];

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket server running');
});

server.on('upgrade', (req, socket, head) => {
  console.log('Upgrade request received');

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    console.log('WebSocket key missing!');
    socket.destroy();
    return;
  }

  const acceptKey = generateAcceptValue(key);

  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
  console.log('WebSocket handshake completed');

  clients.push(socket);

  socket.on('data', (buffer) => {
    console.log('Received raw buffer:', buffer);
    const message = decodeMessage(buffer);
    if (message) {
      console.log('Decoded message:', message);
      // broadcast(message, null) // send the message to all the connected clients
       
       broadcast(`Client ${clients.indexOf(socket)}: ` + message, socket); // exclude the message author when broadcasting
    }
  });

  socket.on('end', () => {
    const index = clients.indexOf(socket);
    if (index !== -1) clients.splice(index, 1);
  });
});

function generateAcceptValue(secWebSocketKey) {
  return crypto
    .createHash('sha1')
    .update(secWebSocketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

function decodeMessage(buffer) {
  const secondByte = buffer[1];
  const length = secondByte & 127;

  if (length === 126) {
    console.log('Handling message longer than 125 bytes is not supported in this example');
    return null;
  }

  const mask = buffer.slice(2, 6);
  const data = buffer.slice(6, 6 + length);

  let decoded = '';
  for (let i = 0; i < data.length; i++) {
    decoded += String.fromCharCode(data[i] ^ mask[i % 4]);
  }

  return decoded;
}

function encodeMessage(str) {
  const message = Buffer.from(str);
  const length = message.length;

  let header;
  if (length < 126) {
    header = Buffer.from([0x81, length]);
  } else {
    throw new Error('Message too long');
  }

  return Buffer.concat([header, message]);
}

const broadcast = (message, sender) => {
  const framed = encodeMessage(message);
  for (const client of clients) {
    if (client !== sender) {
      client.write(framed);
    }
  }
}

server.listen(8000, () => {
  console.log('WebSocket server is running on ws://localhost:8000');
});

