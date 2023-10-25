const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

io.on('connection', (socket) => {
	console.log('A user connected');

	socket.on('send-file', (data) => {
		const { filename, fileBuffer, targetIP } = data;

		// Get the current server's IP address
		const serverIP = getServerIP();

		if (targetIP === serverIP || targetIP === 'localhost' || !targetIP) {
			const writePath = path.join(__dirname, 'uploads', filename);
			fs.writeFileSync(writePath, fileBuffer);

			// Emit to all clients including sender
			io.emit('file-received', { filename: filename });
		}
	});
});

app.get('/uploaded-files', (req, res) => {
	fs.readdir('./uploads', (err, files) => {
		if (err) {
			return res.status(500).send('Error reading uploads directory');
		}
		res.json(files);
	});
});

server.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`);
});

function getServerIP() {
	const networkInterfaces = os.networkInterfaces();
	for (const name of Object.keys(networkInterfaces)) {
		for (const net of networkInterfaces[name]) {
			if (net.family === 'IPv4' && !net.internal) {
				return net.address;
			}
		}
	}
	return 'localhost';
}
