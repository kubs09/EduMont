/* eslint-disable */
const pool = require('../../config/database');

async function getAllowedRecipients(userId, userRole, client) {
  switch (userRole) {
    case 'admin':
      return client.query(
        `WITH user_classes AS (
          SELECT DISTINCT
            u.id,
            u.firstname,
            u.surname,
            u.email,
            u.role,
            c.id as class_id,
            c.name as class_name
          FROM users u
          LEFT JOIN class_teachers ct ON u.id = ct.teacher_id
          LEFT JOIN classes c ON ct.class_id = c.id
          WHERE u.id != $1
          UNION
          SELECT DISTINCT
            u.id,
            u.firstname,
            u.surname,
            u.email,
            u.role,
            c.id as class_id,
            c.name as class_name
          FROM users u
          LEFT JOIN child_parents cp ON u.id = cp.parent_id
          LEFT JOIN children ch ON cp.child_id = ch.id
          LEFT JOIN class_children cc ON ch.id = cc.child_id
          LEFT JOIN classes c ON cc.class_id = c.id
          WHERE u.id != $1
        )
        SELECT 
          id,
          firstname,
          surname,
          email,
          role,
          string_agg(DISTINCT class_name, ', ') as class_names,
          array_agg(DISTINCT class_id) FILTER (WHERE class_id IS NOT NULL) as class_ids
        FROM user_classes
        GROUP BY id, firstname, surname, email, role
        ORDER BY role, surname, firstname`,
        [userId]
      );

    case 'teacher':
      return client.query(
        `WITH teacher_classes AS (
          SELECT c.id as class_id, c.name as class_name
          FROM class_teachers ct
          JOIN classes c ON ct.class_id = c.id
          WHERE ct.teacher_id = $1
        ),
        allowed_users AS (
          -- Get admins
          SELECT u.*, NULL as class_id, NULL as class_name
          FROM users u
          WHERE u.role = 'admin' AND u.id != $1
          UNION ALL
          -- Get other teachers
          SELECT u.*, ct.class_id, c.name as class_name
          FROM users u
          JOIN class_teachers ct ON u.id = ct.teacher_id
          JOIN classes c ON ct.class_id = c.id
          WHERE u.role = 'teacher' AND u.id != $1
          UNION ALL
          -- Get parents of children in teacher's classes
          SELECT DISTINCT u.*, cc.class_id, c.name as class_name
          FROM users u
          JOIN child_parents cp ON u.id = cp.parent_id
          JOIN children ch ON cp.child_id = ch.id
          JOIN class_children cc ON ch.id = cc.child_id
          JOIN classes c ON cc.class_id = c.id
          JOIN teacher_classes tc ON tc.class_id = cc.class_id
          WHERE u.role = 'parent'
        )
        SELECT 
          id,
          firstname,
          surname,
          email,
          role,
          string_agg(DISTINCT class_name, ', ') FILTER (WHERE class_name IS NOT NULL) as class_names,
          array_agg(DISTINCT class_id) FILTER (WHERE class_id IS NOT NULL) as class_ids
        FROM allowed_users
        GROUP BY id, firstname, surname, email, role
        ORDER BY role, surname, firstname`,
        [userId]
      );

    case 'parent':
      return client.query(
        `WITH parent_classes AS (
          SELECT DISTINCT c.id as class_id, c.name as class_name
          FROM child_parents cp
          JOIN children ch ON cp.child_id = ch.id
          JOIN class_children cc ON ch.id = cc.child_id
          JOIN classes c ON cc.class_id = c.id
          WHERE cp.parent_id = $1
        )
        SELECT 
          u.id,
          u.firstname,
          u.surname,
          u.email,
          u.role,
          string_agg(DISTINCT c.name, ', ') as class_names,
          array_agg(DISTINCT ct.class_id) as class_ids
        FROM users u
        JOIN class_teachers ct ON u.id = ct.teacher_id
        JOIN classes c ON ct.class_id = c.id
        JOIN parent_classes pc ON pc.class_id = ct.class_id
        GROUP BY u.id, u.firstname, u.surname, u.email, u.role
        ORDER BY u.surname, u.firstname`,
        [userId]
      );

    default:
      throw new Error('Invalid user role');
  }
}

module.exports = { getAllowedRecipients };
