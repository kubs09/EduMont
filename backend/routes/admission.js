/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { sendInvitationEmail, sendAdmissionResultEmail } = require('../config/mail');
const { extractLanguage } = require('../utils/language');

const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Request admission
router.post('/request', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      firstname,
      surname,
      email,
      phone,
      child_firstname,
      child_surname,
      date_of_birth,
      message,
    } = req.body;

    // Validate required fields - remove phone from required fields
    if (!firstname || !surname || !email || !child_firstname || !child_surname || !date_of_birth) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists in users table
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'user_exists' });
    }

    // Check if there's already a pending request for this email
    const existingRequest = await client.query(
      'SELECT id FROM admission_requests WHERE email = $1 AND status IN ($2, $3)',
      [email, 'pending', 'approved']
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'request_exists' });
    }

    await client.query('BEGIN');

    try {
      // Insert new admission request
      const result = await client.query(
        `INSERT INTO admission_requests 
         (firstname, surname, email, phone, child_firstname, child_surname, date_of_birth, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          firstname,
          surname,
          email,
          phone || null,
          child_firstname,
          child_surname,
          date_of_birth,
          message || null,
        ]
      );

      await client.query('COMMIT');
      res.status(201).json({ id: result.rows[0].id });
    } catch (insertError) {
      await client.query('ROLLBACK');
      throw insertError;
    }
  } catch (error) {
    console.error('Error creating admission request:', error);
    res.status(500).json({ error: 'Failed to create admission request' });
  } finally {
    client.release();
  }
});

// Get admission status and next steps
router.get('/status', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        u.admission_status,
        COALESCE(
          json_agg(
            json_build_object(
              'step_id', s.id,
              'name', s.name,
              'description', s.description,
              'required_documents', s.required_documents,
              'order_index', s.order_index,
              'status', COALESCE(p.status, 'pending'),
              'submitted_at', p.submitted_at,
              'reviewed_at', p.reviewed_at,
              'admin_notes', p.admin_notes,
              'appointment_id', p.appointment_id,
              'preferred_online', p.preferred_online,
              'appointment_status', p.appointment_status,
              'appointment', CASE 
                WHEN a.id IS NOT NULL THEN
                  json_build_object(
                    'date', a.date,
                    'online', a.online
                  )
                ELSE NULL
              END
            ) ORDER BY s.order_index
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as steps
      FROM users u
      LEFT JOIN admission_progress p ON u.id = p.user_id
      LEFT JOIN admission_steps s ON p.step_id = s.id
      LEFT JOIN info_appointments a ON p.appointment_id = a.id
      WHERE u.id = $1
      GROUP BY u.id, u.admission_status`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admission status' });
  } finally {
    client.release();
  }
});

// Submit step documents and data
router.post('/submit/:stepId', auth, upload.array('documents'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { stepId } = req.params;
    const { formData } = req.body;
    const files = req.files;

    // Validate step exists and is next in sequence
    const stepCheck = await client.query(
      `SELECT s.* FROM admission_steps s
       LEFT JOIN admission_progress p ON p.step_id = s.id AND p.user_id = $1
       WHERE s.id = $2`,
      [req.user.id, stepId]
    );

    if (stepCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Store documents info and form data
    const documents = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
    }));

    await client.query(
      `INSERT INTO admission_progress 
       (user_id, step_id, status, documents, submitted_at) 
       VALUES ($1, $2, 'submitted', $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, step_id) 
       DO UPDATE SET 
         status = 'submitted',
         documents = $3,
         submitted_at = CURRENT_TIMESTAMP,
         reviewed_at = NULL,
         reviewed_by = NULL`,
      [req.user.id, stepId, JSON.stringify({ documents, formData })]
    );

    // Update user's admission status if it's still pending
    await client.query(
      `UPDATE users SET admission_status = 'in_progress' 
       WHERE id = $1 AND admission_status = 'pending'`,
      [req.user.id]
    );

    res.json({ message: 'Step submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit step' });
  } finally {
    client.release();
  }
});

// Admin routes
router.get('/pending', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.firstname, u.surname, u.email,
        p.step_id, p.status, p.submitted_at,
        s.name as step_name
       FROM users u
       JOIN admission_progress p ON u.id = p.user_id
       JOIN admission_steps s ON p.step_id = s.id
       WHERE p.status = 'submitted'
       ORDER BY p.submitted_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
});

router.post('/review/:userId/:stepId', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { userId, stepId } = req.params;
    const { status, adminNotes } = req.body;

    await client.query('BEGIN');

    // Update step status
    await client.query(
      `UPDATE admission_progress 
       SET status = $1, 
           admin_notes = $2,
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = $3
       WHERE user_id = $4 AND step_id = $5`,
      [status, adminNotes, req.user.id, userId, stepId]
    );

    if (status === 'approved') {
      // When approving a step, set the next step to pending
      await client.query(
        `UPDATE admission_progress 
         SET status = 'pending'
         WHERE user_id = $1 
         AND step_id = (
           SELECT id FROM admission_steps 
           WHERE order_index = (
             SELECT order_index + 1 
             FROM admission_steps 
             WHERE id = $2
           )
         )`,
        [userId, stepId]
      );
    }

    // If rejected, update user's admission status
    if (status === 'rejected') {
      await client.query('UPDATE users SET admission_status = $1 WHERE id = $2', [
        'rejected',
        userId,
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to submit review' });
  } finally {
    client.release();
  }
});

// Get all admission requests (admin only)
router.get('/admin/admissions', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        id,
        firstname,
        surname,
        email,
        phone,
        child_firstname,
        child_surname,
        date_of_birth,
        message,
        status,
        denial_reason
       FROM admission_requests 
       WHERE email NOT IN (SELECT email FROM users)
       ORDER BY surname DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ error: 'Failed to fetch admission requests' });
  } finally {
    client.release();
  }
});

router.post('/admin/admissions/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get admission request details and lock the row
    const {
      rows: [admission],
    } = await client.query(
      'SELECT * FROM admission_requests WHERE id = $1 AND status = $2 FOR UPDATE',
      [req.params.id, 'pending']
    );

    if (!admission) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Admission request not found or already processed' });
    }

    // Update status to approved
    await client.query('UPDATE admission_requests SET status = $1 WHERE id = $2', [
      'approved',
      req.params.id,
    ]);

    await client.query('COMMIT');

    // After successful commit, try to send emails
    try {
      const language = extractLanguage(req);
      await sendAdmissionResultEmail(admission, true, null, { language });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    res.json({ message: 'Admission approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving admission:', error);
    res.status(500).json({ error: 'Failed to approve admission' });
  } finally {
    client.release();
  }
});

// Add new route to update status to invited
router.post('/admin/admissions/:id/set-invited', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE admission_requests SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['invited', req.params.id, 'approved']
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res
        .status(404)
        .json({ error: 'Admission request not found or not in approved state' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Status updated to invited' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating to invited:', error);
    res.status(500).json({ error: 'Failed to update status' });
  } finally {
    client.release();
  }
});

// Deny admission request
router.post('/admin/admissions/:id/deny', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { reason } = req.body;
    const language = extractLanguage(req);
    if (!reason) {
      return res.status(400).json({ error: 'Denial reason is required' });
    }

    const result = await client.query(
      `UPDATE admission_requests 
       SET status = $1, denial_reason = $2 
       WHERE id = $3 
       RETURNING *`,
      ['denied', reason, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admission request not found' });
    }

    // Send denial email with language preference
    await sendAdmissionResultEmail(result.rows[0], false, reason, { language });

    res.json({ message: 'Admission request denied' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deny admission' });
  } finally {
    client.release();
  }
});

// Admin: Get all users with pending admission progress
router.get('/admin/pending-users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
         u.id, 
         u.firstname, 
         u.surname, 
         u.email,
         c.firstname as child_firstname,
         c.surname as child_surname,
         c.date_of_birth as child_date_of_birth,
         (
           SELECT json_build_object(
                    'step_id', p.step_id,
                    'name', s.name,
                    'status', p.status
                  )
           FROM admission_progress p
           JOIN admission_steps s ON p.step_id = s.id
           WHERE p.user_id = u.id
           ORDER BY s.order_index ASC
           LIMIT 1
         ) as current_step
       FROM users u
       LEFT JOIN children c ON c.parent_id = u.id
       WHERE u.role = 'parent'
         AND u.admission_status IN ('pending', 'in_progress')
       ORDER BY u.surname DESC`
    );

    // Ensure current_step is never null in the response
    const processedResults = result.rows.map((row) => ({
      ...row,
      current_step: row.current_step || {
        step_id: 1,
        name: 'Information Meeting',
        status: 'pending',
      },
    }));

    res.json(processedResults);
  } catch (error) {
    console.error('Error fetching pending admission users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  } finally {
    client.release();
  }
});

// Admin: Get detailed admission progress for a user
router.get('/admin/users/:userId/progress', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const result = await client.query(
      `SELECT 
        u.admission_status,
        json_agg(
          json_build_object(
            'step_id', s.id,
            'name', s.name,
            'description', s.description,
            'required_documents', s.required_documents,
            'order_index', s.order_index,
            'status', p.status,
            'submitted_at', p.submitted_at,
            'reviewed_at', p.reviewed_at,
            'admin_notes', p.admin_notes,
            'preferred_online', p.preferred_online,
            'appointment', CASE 
              WHEN a.id IS NOT NULL THEN
                json_build_object(
                  'date', a.date,
                  'online', a.online
                )
              ELSE NULL
            END
          ) ORDER BY s.order_index
        ) as steps
      FROM users u
      JOIN admission_progress p ON u.id = p.user_id
      JOIN admission_steps s ON p.step_id = s.id
      LEFT JOIN info_appointments a ON p.appointment_id = a.id
      WHERE u.id = $1
      GROUP BY u.id, u.admission_status`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user admission progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  } finally {
    client.release();
  }
});

// Get available appointments
router.get('/appointments', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        a.id,
        a.date,
        a.online,
        a.capacity - COUNT(p.appointment_id) as available_spots
      FROM info_appointments a
      LEFT JOIN admission_progress p ON a.id = p.appointment_id
      WHERE a.date > CURRENT_TIMESTAMP
      GROUP BY a.id, a.date, a.capacity, a.online
      HAVING a.capacity - COUNT(p.appointment_id) > 0
      ORDER BY a.date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  } finally {
    client.release();
  }
});

// Schedule appointment
router.post('/appointments/:appointmentId', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { appointmentId } = req.params;

    await client.query('BEGIN');

    // Check for existing appointment
    const existingAppointment = await client.query(
      `SELECT appointment_status, appointment_id 
       FROM admission_progress 
       WHERE user_id = $1 
       AND step_id = (SELECT id FROM admission_steps WHERE order_index = 1)`,
      [req.user.id]
    );

    if (
      existingAppointment.rows[0]?.appointment_id &&
      existingAppointment.rows[0]?.appointment_status !== 'rejected'
    ) {
      throw new Error('You already have a scheduled appointment');
    }

    // Check availability
    const availabilityCheck = await client.query(
      `SELECT 
        a.capacity,
        COALESCE(COUNT(p.appointment_id) FILTER (WHERE p.appointment_status != 'rejected'), 0) as booked_spots
       FROM info_appointments a
       LEFT JOIN admission_progress p ON a.id = p.appointment_id
       WHERE a.id = $1
       GROUP BY a.id, a.capacity`,
      [appointmentId]
    );

    if (availabilityCheck.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const { capacity, booked_spots } = availabilityCheck.rows[0];
    if (booked_spots >= capacity) {
      throw new Error('Appointment is full');
    }

    // Update admission progress with appointment
    const result = await client.query(
      `UPDATE admission_progress 
       SET appointment_id = $1,
           status = 'pending_review',
           submitted_at = CURRENT_TIMESTAMP,
           appointment_status = 'pending_review'
       WHERE user_id = $2 
       AND step_id = (SELECT id FROM admission_steps WHERE order_index = 1)
       RETURNING *`,
      [appointmentId, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update admission progress');
    }

    // Update user's admission status if needed
    await client.query(
      `UPDATE users 
       SET admission_status = CASE 
         WHEN admission_status = 'pending' THEN 'in_progress'
         ELSE admission_status
       END
       WHERE id = $1`,
      [req.user.id]
    );

    await client.query('COMMIT');
    res.json({
      message: 'Appointment scheduled successfully',
      status: 'pending_review',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Add new endpoint for reviewing appointments (admin only)
router.post('/admin/appointments/:userId/review', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.query('BEGIN');

    // Update the status but don't automatically set next step
    const result = await client.query(
      `UPDATE admission_progress 
       SET status = $1,
           admin_notes = $2,
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = $3
       WHERE user_id = $4 
       AND step_id = (SELECT id FROM admission_steps WHERE order_index = 1)
       RETURNING *`,
      [status, adminNotes, req.user.id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    // If rejected, update user's admission status
    if (status === 'rejected') {
      await client.query('UPDATE users SET admission_status = $1 WHERE id = $2', [
        'rejected',
        userId,
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Review completed', status });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reviewing appointment:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get available terms (from info_appointments)
router.get('/terms', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        a.id,
        a.date,
        a.capacity,
        a.online,
        a.capacity - COUNT(p.appointment_id) as available_spots
      FROM info_appointments a
      LEFT JOIN admission_progress p ON a.id = p.appointment_id
      WHERE a.date > CURRENT_TIMESTAMP
      GROUP BY a.id, a.date, a.capacity, a.online
      HAVING a.capacity - COUNT(p.appointment_id) > 0
      ORDER BY a.date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  } finally {
    client.release();
  }
});

// Initialize admission process
router.post('/initialize', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the first step (Information Meeting)
    const firstStep = await client.query('SELECT id FROM admission_steps WHERE order_index = 1');

    if (firstStep.rows.length === 0) {
      throw new Error('First step not found');
    }

    // Initialize admission progress for the first step
    await client.query(
      `INSERT INTO admission_progress (user_id, step_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, step_id) DO NOTHING`,
      [req.user.id, firstStep.rows[0].id]
    );

    // Update user's admission status to in_progress if it's still pending
    await client.query(
      `UPDATE users 
       SET admission_status = 'in_progress' 
       WHERE id = $1 AND admission_status = 'pending'`,
      [req.user.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Admission process initialized' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing admission:', error);
    res.status(500).json({ error: 'Failed to initialize admission process' });
  } finally {
    client.release();
  }
});

module.exports = router;
