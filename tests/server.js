const express = require('express');

const app = express();

const PORT = 3333;

app.use(express.static('./'));

app.listen(PORT, function () {
	console.log(`Test server listening on port ${PORT}!`);
}); 