require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path = require('path');
const { initDb, getDb } = require('./database');
const giftsRouter = require('./routes/gifts');
const selectionsRouter = require('./routes/selections');
const { sendEmail } = require('./routes/services/mailer');

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
    const guests = db.prepare('SELECT id, name, email, phone FROM guests ORDER BY id').all();
    res.json(guests);
  } catch (err) {
    console.error('Error fetching guests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { guest_id } = req.body;
    const db = getDb();

    const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(Number(guest_id));
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    if (!guest.email) {
      return res.status(400).json({ error: 'Guest has no email address' });
    }

    const selections = db
      .prepare(
        `SELECT s.quantity, g.name as gift_name, g.price
         FROM selections s
         JOIN gifts g ON s.gift_id = g.id
         WHERE s.guest_id = ?`
      )
      .all(guest_id);

    if (selections.length === 0) {
      return res.status(400).json({ error: 'No selections to send' });
    }

    await sendEmail(guest.name, guest.email, selections);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
