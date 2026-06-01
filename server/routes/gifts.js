const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const gifts = db.prepare('SELECT * FROM gifts ORDER BY id').all();

    const result = gifts.map((gift) => {
      const selections = db
        .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM selections WHERE gift_id = ?')
        .get(gift.id);
      return {
        ...gift,
        links: JSON.parse(gift.links || '[]'),
        selected_total: selections.total
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching gifts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(Number(req.params.id));

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    const selections = db
      .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM selections WHERE gift_id = ?')
      .get(gift.id);

    res.json({
      ...gift,
      links: JSON.parse(gift.links || '[]'),
      selected_total: selections.total
    });
  } catch (err) {
    console.error('Error fetching gift:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
