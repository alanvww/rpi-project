const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

const storage = multer.diskStorage({
	destination: './uploads/',
	filename: (req, file, cb) => {
		cb(null, 'file-' + Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

io.on('connection', (socket) => {
	console.log('A user connected');

	socket.on('send-file', async (data) => {
		const { file, targetIP } = data;
		io.emit('receive-file', { file: file, ip: targetIP });
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

app.post('/upload', upload.single('file'), (req, res) => {
	if (req.file) {
		const targetIP = req.body.ipAddress; // Extract the IP address from the form
		io.emit('send-file', { file: req.file, targetIP: targetIP });
		res.send('File uploaded and sent via socket.io');
	} else {
		res.redirect('/');
	}
});

app.use('/uploads', express.static('uploads'));

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
