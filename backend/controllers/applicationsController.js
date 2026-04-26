const pool = require('../config/db');

exports.createApplication = async (req, res, next) => {
  const {
    full_name, age, nationality, gender, city,
    phone, email, cover_message, application_type,
    work_preference, english_level, experience,
    shift_preference, employment_type, graduation_status,
    selected_offer_id
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO applications (
        full_name, age, nationality, gender, city,
        phone, email, cover_message, application_type,
        work_preference, english_level, experience,
        shift_preference, employment_type, graduation_status,
        selected_offer_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id`,
      [
        full_name, age, nationality, gender, city,
        phone || null, email || null, cover_message || null,
        application_type || 'direct',
        work_preference || null, english_level, experience,
        shift_preference || null, employment_type || null, graduation_status,
        selected_offer_id || null
      ]
    );
    res.status(201).json({
      success: true,
      applicationId: result.rows[0].id,
      message: 'Application submitted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT a.*, o.company_name, o.job_title
      FROM applications a
      LEFT JOIN offers o ON a.selected_offer_id = o.id
      ORDER BY a.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['new', 'reviewed', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ success: true, message: `Status updated to "${status}"` });
  } catch (err) {
    next(err);
  }
};

exports.deleteApplication = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    next(err);
  }
};
