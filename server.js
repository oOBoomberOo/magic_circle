const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const root = 'src/html/';
const file = 'src/';
const static_root = express.static(root);
const static_file = express.static(file);

app.use('/file/', static_file);

app.use('/', static_root, (request, response) => {
	let url = request.url.split('?')[0] + '.html';
	let file = path.join(__dirname, root, url);
	console.log(url, file);
	response.sendFile(file);
});

app.listen(port, () => {
	console.log(`Listening to port: ${port}`);
});