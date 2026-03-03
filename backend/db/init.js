import { query } from '../config/database.js';
import console from 'console';

const initDatabase = async () => {
  const createUserRoleEnum = `
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      firstname VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      password VARCHAR(100) NOT NULL,
      role user_role NOT NULL,
      reset_token VARCHAR(64),
      reset_token_expiry TIMESTAMP,
      message_notifications BOOLEAN DEFAULT TRUE,
      phone VARCHAR(20)
    );
  `;

  const createInvitationsTable = `
    CREATE TABLE IF NOT EXISTS invitations (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      token VARCHAR(100) UNIQUE NOT NULL,
      role user_role NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );
  `;

  const createClassesTable = `
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      min_age INTEGER,
      max_age INTEGER
    );
  `;

  const createClassTeachersTable = `
    CREATE TABLE IF NOT EXISTS class_teachers (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'assistant')),
      PRIMARY KEY (class_id, teacher_id),
      UNIQUE (class_id, role)
    );
  `;

  const createClassChildrenTable = `
    CREATE TABLE IF NOT EXISTS class_children (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (class_id, child_id),
      UNIQUE (child_id)
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      subject VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP,
      deleted_by_sender BOOLEAN DEFAULT FALSE,
      deleted_by_recipient BOOLEAN DEFAULT FALSE
    );
  `;

  const createChildrenTable = `
    CREATE TABLE IF NOT EXISTS children (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      notes TEXT
    );
  `;

  const createChildParentsTable = `
    CREATE TABLE IF NOT EXISTS child_parents (
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (child_id, parent_id)
    );
  `;

  const createDocumentsTable = `
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_name VARCHAR(255),
      mime_type VARCHAR(100),
      size_bytes INTEGER CHECK (size_bytes >= 0),
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (class_id IS NOT NULL OR child_id IS NOT NULL)
    );
  `;

  const createClassAttendanceTable = `
    CREATE TABLE IF NOT EXISTS class_attendance (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
      check_in_at TIMESTAMP,
      check_out_at TIMESTAMP,
      checked_in_by INTEGER REFERENCES users(id),
      checked_out_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (check_out_at IS NULL OR check_in_at IS NOT NULL),
      CHECK (check_out_at IS NULL OR check_out_at >= check_in_at),
      UNIQUE (class_id, child_id, attendance_date)
    );
  `;

  const createChildExcusesTable = `
    CREATE TABLE IF NOT EXISTS child_excuses (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (date_to >= date_from)
    );
  `;

  const createCategoryPresentationsTable = `
    CREATE TABLE IF NOT EXISTS category_presentations (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(200) NOT NULL,
      age_group VARCHAR(50) NOT NULL,
      display_order INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (age_group IN ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School')),
      UNIQUE (category, age_group, display_order)
    );
  `;

  const createPresentationsTable = `
    CREATE TABLE IF NOT EXISTS presentations (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      display_order INTEGER DEFAULT 0,
      status VARCHAR(30) DEFAULT 'prerequisites not met' CHECK (
        status IN ('prerequisites not met', 'to be presented', 'presented', 'practiced', 'mastered')
      ),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER REFERENCES users(id)
    );
  `;

  try {
    // Create tables in dependency order
    await query(createUserRoleEnum);
    await query(createUsersTable);
    await query(createInvitationsTable);
    await query(createChildrenTable);
    await query(createChildParentsTable);
    await query(createClassesTable);
    await query(createClassTeachersTable);
    await query(createClassChildrenTable);
    await query(createMessagesTable);
    await query(createDocumentsTable);
    await query(createClassAttendanceTable);
    await query(createChildExcusesTable);
    await query(createCategoryPresentationsTable);
    await query(createPresentationsTable);

    // Verify all tables exist with a single query
    const verifyQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'users', 'invitations', 'children', 'child_parents', 'classes',
          'class_teachers', 'class_children', 'messages', 'documents',
          'class_attendance', 'child_excuses', 'category_presentations', 'presentations'
        )
      ) as tables_exist
    `;

    const result = await query(verifyQuery);
    if (!result.rows[0]?.tables_exist) {
      throw new Error('Table verification failed');
    }

    console.log('✅ Database tables initialized and verified successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw new Error(`Database initialization failed: ${err.message}`);
  }
};

export default initDatabase;
