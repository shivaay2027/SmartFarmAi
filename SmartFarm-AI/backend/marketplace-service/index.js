const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => res.send('Marketplace Service OK'));

app.listen(port, () => console.log(`Marketplace service running on port ${port}`));
