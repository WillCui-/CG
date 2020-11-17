const express = require('express');
const app = express();

app.use(express.static('assignment8'));
app.listen(3000);
