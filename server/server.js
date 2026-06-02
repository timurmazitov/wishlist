require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path = require('path');
const { initDb, getDb } = require('./database');
const giftsRouter = require('./routes/gifts');
const selectionsRouter = require('./routes/selections');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'client')));

initDb();

app.use('/api/gifts', giftsRouter);
app.use('/api/selections', selectionsRouter);

app.get('/api/guests', (req, res) => {
  try {
    const db = getDb();
    const guests = db.prepare('SELECT id, name, phone FROM guests ORDER BY name').all();
    res.json(guests);
  } catch (err) {
    console.error('Error fetching guests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
