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

// Configure storage
const storage = multer.diskStorage({
	destination: './uploads/',
	filename: (req, file, cb) => {
		cb(null, 'file-' + Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

app.use(express.static('public')); // Serve static files from 'public' directory

io.on('connection', (socket) => {
	console.log('A user connected');

	socket.on('send-file', async (data) => {
		const { file, targetIP } = data;
		// Use the file data to save, process, or send it further
		// Note: you might want to implement your own mechanism for sending the file data using socket.io

		// After processing the file, you can emit a response to the client
		socket.emit('file-response', { message: 'File received and processed' });
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

app.post('/upload', upload.single('file'), (req, res) => {
	if (req.file) {
		// Assuming that we will send the file content to a specific socket.io client
		// In reality, you'd probably want more logic here to determine which client should receive the file
		io.emit('receive-file', { file: req.file });
		res.send('File uploaded and sent via socket.io');
	} else {
		res.redirect('/');
	}
});

// Display 'uploads' folder contents
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
