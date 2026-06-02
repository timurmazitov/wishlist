const express = require('express');
const { getDb, query } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  query(async () => {
    const db = getDb();
    const guestId = Number(req.query.guest_id);

    if (!guestId) {
      res.status(400).json({ error: 'guest_id is required' });
      return;
    }

    const selections = db
      .prepare(
        `SELECT s.id, s.guest_id, s.gift_id, s.quantity, s.created_at,
                g.name as gift_name, g.description, g.image_path, g.price, g.links
         FROM selections s
         JOIN gifts g ON s.gift_id = g.id
         WHERE s.guest_id = ?
          ORDER BY g.name COLLATE NOCASE`
      )
      .all(guestId);

    const result = selections.map((s) => ({
      ...s,
      links: JSON.parse(s.links || '[]')
    }));

    res.json(result);
  }).catch((err) => {
    console.error('Error fetching selections:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/', (req, res) => {
  query(async () => {
    const db = getDb();
    const { guest_id, gift_id, quantity } = req.body;

    if (!guest_id || !gift_id) {
      res.status(400).json({ error: 'guest_id and gift_id are required' });
      return;
    }

    db.exec('BEGIN IMMEDIATE');

    const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(Number(gift_id));
    if (!gift) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(Number(guest_id));
    if (!guest) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    const qty = Number(quantity) || 1;

    if (gift.total_needed > 0) {
      const existingTotal = db
        .prepare(
          `SELECT COALESCE(SUM(s.quantity), 0) as total
           FROM selections s
           WHERE s.gift_id = ? AND s.guest_id != ?`
        )
        .get(gift.id, guest_id);

      const myCurrent = db
        .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM selections WHERE guest_id = ? AND gift_id = ?')
        .get(guest_id, gift.id);

      const available = gift.total_needed - existingTotal.total - myCurrent.total;

      if (qty > available) {
        db.exec('ROLLBACK');
        res.status(400).json({
          error: `Доступно только ${available} шт.`,
          available
        });
        return;
      }
    }

    const existing = db
      .prepare('SELECT * FROM selections WHERE guest_id = ? AND gift_id = ?')
      .get(guest_id, gift.id);

    if (existing) {
      if (qty <= 0) {
        db.prepare('DELETE FROM selections WHERE id = ?').run(existing.id);
      } else {
        db.prepare('UPDATE selections SET quantity = ? WHERE id = ?').run(qty, existing.id);
      }
    } else {
      if (qty > 0) {
        db.prepare('INSERT INTO selections (guest_id, gift_id, quantity) VALUES (?, ?, ?)').run(
          guest_id,
          gift.id,
          qty
        );
      }
    }

    db.exec('COMMIT');
    res.json({ success: true });
  }).catch((err) => {
    console.error('Error saving selection:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.delete('/', (req, res) => {
  query(async () => {
    const db = getDb();
    const guestId = Number(req.query.guest_id);

    if (!guestId) {
      res.status(400).json({ error: 'guest_id is required' });
      return;
    }

    db.prepare('DELETE FROM selections WHERE guest_id = ?').run(guestId);

    res.json({ success: true });
  }).catch((err) => {
    console.error('Error clearing selections:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

module.exports = router;
