const pool = require('../config/db');

exports.getOffers = async (req, res, next) => {
  const status = req.query.status || 'active';
  try {
    let query = 'SELECT * FROM offers';
    let params = [];
    if (status !== 'all') {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getOfferById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.toggleOfferStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['active', 'hold'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Status must be "active" or "hold"' });
  }
  try {
    const result = await pool.query(
      'UPDATE offers SET status = $1 WHERE id = $2',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    res.json({ success: true, message: `Offer status set to "${status}"` });
  } catch (err) {
    next(err);
  }
};
