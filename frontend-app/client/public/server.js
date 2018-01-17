const express = require('express');
const compress = require('compression');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(compress());

app.use(express.static(path.join(__dirname, '/assets')));

app.get('(/login|/asset/[\\w|\\d|-]+|/discovery)', function (req, res) {
  console.info(req.url);
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(PORT, () => {
  console.info('Listening on port:', PORT);
});
