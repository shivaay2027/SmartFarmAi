const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => res.send('Auth Service OK'));

app.listen(port, () => console.log(`Auth service running on port ${port}`));
