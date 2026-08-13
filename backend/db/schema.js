import {
  boolean,
  check,
  date,
  integer,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['admin', 'teacher', 'parent']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 100 }).notNull(),
    firstname: varchar('firstname', { length: 100 }).notNull(),
    surname: varchar('surname', { length: 100 }).notNull(),
    password: varchar('password', { length: 100 }).notNull(),
    role: userRole('role').notNull(),
    resetToken: varchar('reset_token', { length: 64 }),
    resetTokenExpiry: timestamp('reset_token_expiry'),
    messageNotifications: boolean('message_notifications').default(true),
    phone: varchar('phone', { length: 20 }),
  },
  (table) => ({
    emailUnique: uniqueIndex('users_email_unique').on(table.email),
    resetTokenIndex: index('idx_users_reset_token').on(table.resetToken),
  })
);

export const children = pgTable('children', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 100 }).notNull(),
  surname: varchar('surname', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  notes: text('notes'),
});

export const childParents = pgTable(
  'child_parents',
  {
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    primary: primaryKey({ columns: [table.childId, table.parentId] }),
    parentIndex: index('idx_child_parents_parent_id').on(table.parentId),
  })
);

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 100 }).notNull(),
  token: varchar('token', { length: 100 }).notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const classes = pgTable(
  'classes',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    ageGroup: varchar('age_group', { length: 50 }).notNull(),
    minAge: integer('min_age').notNull(),
    maxAge: integer('max_age').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ageGroupCheck: check(
      'classes_age_group_check',
      sql`${table.ageGroup} in ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School')`
    ),
    ageBoundsCheck: check(
      'classes_age_bounds_check',
      sql`${table.minAge} >= 0 and ${table.maxAge} >= ${table.minAge}`
    ),
  })
);

export const classTeachers = pgTable(
  'class_teachers',
  {
    classId: integer('class_id').references(() => classes.id),
    teacherId: integer('teacher_id').references(() => users.id),
    role: varchar('role', { length: 20 }).notNull(),
    permissionRequested: boolean('permission_requested').default(false),
  },
  (table) => ({
    primary: primaryKey({ columns: [table.classId, table.teacherId] }),
    classRoleUnique: uniqueIndex('class_teachers_class_role_unique').on(table.classId, table.role),
    teacherUnique: uniqueIndex('idx_class_teachers_teacher_id_unique').on(table.teacherId),
  })
);

export const classChildren = pgTable(
  'class_children',
  {
    classId: integer('class_id').references(() => classes.id),
    childId: integer('child_id').references(() => children.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    primary: primaryKey({ columns: [table.classId, table.childId] }),
    childUnique: uniqueIndex('class_children_child_id_unique').on(table.childId),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    subject: varchar('subject', { length: 200 }).notNull(),
    content: text('content').notNull(),
    fromUserId: integer('from_user_id').references(() => users.id),
    toUserId: integer('to_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    readAt: timestamp('read_at'),
    deletedBySender: boolean('deleted_by_sender').default(false),
    deletedByRecipient: boolean('deleted_by_recipient').default(false),
  },
  (table) => ({
    fromUserIndex: index('idx_messages_from_user').on(table.fromUserId),
    toUserIndex: index('idx_messages_to_user').on(table.toUserId),
  })
);

export const classHistory = pgTable(
  'class_history',
  {
    id: serial('id').primaryKey(),
    classId: integer('class_id').references(() => classes.id),
    date: date('date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
  },
  (table) => ({
    classIndex: index('idx_class_history_class_id').on(table.classId),
    dateIndex: index('idx_class_history_date').on(table.date),
  })
);

export const classAttendance = pgTable(
  'class_attendance',
  {
    id: serial('id').primaryKey(),
    classId: integer('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    attendanceDate: date('attendance_date')
      .notNull()
      .default(sql`CURRENT_DATE`),
    checkInAt: timestamp('check_in_at'),
    checkOutAt: timestamp('check_out_at'),
    checkedInBy: integer('checked_in_by').references(() => users.id),
    checkedOutBy: integer('checked_out_by').references(() => users.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniqueAttendance: uniqueIndex('class_attendance_class_child_date_unique').on(
      table.classId,
      table.childId,
      table.attendanceDate
    ),
    classDateIndex: index('idx_class_attendance_class_date').on(
      table.classId,
      table.attendanceDate
    ),
    childDateIndex: index('idx_class_attendance_child_date').on(
      table.childId,
      table.attendanceDate
    ),
  })
);

export const childExcuses = pgTable(
  'child_excuses',
  {
    id: serial('id').primaryKey(),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id').references(() => users.id, { onDelete: 'set null' }),
    dateFrom: date('date_from').notNull(),
    dateTo: date('date_to').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    dateBounds: check('child_excuses_date_bounds_check', sql`${table.dateTo} >= ${table.dateFrom}`),
    childIndex: index('idx_child_excuses_child_id').on(table.childId),
    parentIndex: index('idx_child_excuses_parent_id').on(table.parentId),
    dateFromIndex: index('idx_child_excuses_date_from').on(table.dateFrom),
  })
);

export const categoryPresentations = pgTable(
  'category_presentations',
  {
    id: serial('id').primaryKey(),
    category: varchar('category', { length: 100 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    ageGroup: varchar('age_group', { length: 50 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ageGroupCheck: check(
      'category_presentations_age_group_check',
      sql`${table.ageGroup} in ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School')`
    ),
    uniqueTemplate: uniqueIndex('category_presentations_category_age_display_unique').on(
      table.category,
      table.ageGroup,
      table.displayOrder
    ),
    categoryIndex: index('idx_category_presentations_category').on(table.category),
    ageGroupIndex: index('idx_category_presentations_age_group').on(table.ageGroup),
    categoryAgeIndex: index('idx_category_presentations_category_age').on(
      table.category,
      table.ageGroup
    ),
  })
);

export const presentations = pgTable(
  'presentations',
  {
    id: serial('id').primaryKey(),
    childId: integer('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    classId: integer('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    category: varchar('category', { length: 100 }),
    displayOrder: integer('display_order').default(0),
    status: varchar('status', { length: 30 }).default('prerequisites not met').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedAt: timestamp('updated_at').defaultNow(),
    updatedBy: integer('updated_by').references(() => users.id),
  },
  (table) => ({
    statusCheck: check(
      'presentations_status_check',
      sql`${table.status} in ('prerequisites not met', 'to be presented', 'presented', 'practiced', 'mastered')`
    ),
    childIndex: index('idx_presentations_child_id').on(table.childId),
    classIndex: index('idx_presentations_class_id').on(table.classId),
    statusIndex: index('idx_presentations_status').on(table.status),
    categoryStatusIndex: index('idx_presentations_category_status').on(
      table.category,
      table.status
    ),
    childCategoryIndex: index('idx_presentations_child_category').on(table.childId, table.category),
    // Deferrable (DEFERRABLE INITIALLY DEFERRED) at the DB level so that
    // reassigning a child's class can update classChildren and this table in
    // either order within one transaction without an immediate FK violation
    // (classChildren.childId is unique, so a child can never simultaneously
    // satisfy the old and new class). drizzle-orm's foreignKey() builder does
    // not support declaring that here — see the hand-written migration
    // db/drizzle/0001_defer_presentations_class_child_fk.sql. Do not run
    // `drizzle-kit generate` off this definition without re-adding that
    // deferrable clause, or it will regenerate a non-deferrable constraint.
    classChildFk: foreignKey({
      name: 'fk_presentations_class_child',
      columns: [table.classId, table.childId],
      foreignColumns: [classChildren.classId, classChildren.childId],
    }),
  })
);

export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    fileUrl: text('file_url').notNull(),
    fileName: varchar('file_name', { length: 255 }),
    mimeType: varchar('mime_type', { length: 100 }),
    sizeBytes: integer('size_bytes'),
    classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
    childId: integer('child_id').references(() => children.id, { onDelete: 'cascade' }),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedBy: integer('updated_by').references(() => users.id),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    classIndex: index('idx_documents_class_id').on(table.classId),
    childIndex: index('idx_documents_child_id').on(table.childId),
    createdByIndex: index('idx_documents_created_by').on(table.createdBy),
    sizeCheck: check(
      'documents_size_bytes_check',
      sql`${table.sizeBytes} is null or ${table.sizeBytes} >= 0`
    ),
    targetCheck: check(
      'documents_target_check',
      sql`${table.classId} is not null or ${table.childId} is not null`
    ),
  })
);

export const presentationPermissions = pgTable(
  'presentation_permissions',
  {
    id: serial('id').primaryKey(),
    adminId: integer('admin_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    classId: integer('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    permissionRequested: boolean('permission_requested').default(false),
    granted: boolean('granted').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    adminClassUnique: uniqueIndex('presentation_permissions_admin_class_unique').on(
      table.adminId,
      table.classId
    ),
    adminIndex: index('idx_presentation_permissions_admin_id').on(table.adminId),
    classIndex: index('idx_presentation_permissions_class_id').on(table.classId),
    requestedIndex: index('idx_presentation_permissions_requested')
      .on(table.permissionRequested)
      .where(sql`${table.permissionRequested} = true`),
    grantedCheck: check(
      'presentation_permissions_granted_check',
      sql`${table.granted} = false or ${table.permissionRequested} = true`
    ),
  })
);

export const tables = {
  users,
  children,
  childParents,
  invitations,
  classes,
  classTeachers,
  classChildren,
  messages,
  classHistory,
  classAttendance,
  childExcuses,
  categoryPresentations,
  presentations,
  documents,
  presentationPermissions,
};
