const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
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

app.post('/upload', upload.single('file'), async (req, res) => {
	if (req.file !== undefined) {
		const targetIP = req.body.ipAddress;
		const file = req.file;

		// Send file to the target IP (assuming target server listens on port 3000 and has an /upload endpoint)
		const formData = new FormData();
		await formData.append('file', fs.createReadStream(file.path));

		try {
			console.log(targetIP);
			await axios.post(`http://${targetIP}:3000/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			res.send('File sent successfully!');
			// Redirect to homepage after successful upload
		} catch (error) {
			res.send('Error sending file: ' + error.message);
		}
	} else {
		return res.redirect('/');
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

app.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`);
});
