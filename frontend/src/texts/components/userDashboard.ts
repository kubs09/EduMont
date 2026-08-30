import { common, type Entity } from './common';

const userEntity: Entity = {
  label: { cs: 'Uživatel', en: 'User' },
  accusative: 'uživatele',
  gender: 'masc',
};

export const userDashboard = {
  errors: {
    genericTitle: {
      cs: 'Chyba',
      en: 'Error',
    },
    fetchListFailed: {
      cs: 'Nepodařilo se načíst seznam uživatelů. Zkuste to prosím později.',
      en: 'Failed to load user list. Please try again later.',
    },
    createFailed: common.templates.errors.failedToCreate(userEntity),
    userExists: {
      cs: 'Uživatel s tímto emailem již existuje',
      en: 'User with this email already exists',
    },
    invitationExists: {
      cs: 'Pozvánka pro tento email již byla odeslána',
      en: 'An invitation has already been sent to this email',
    },
    deleteFailed: common.templates.errors.failedToDelete(userEntity),
    cannotDeleteSelf: {
      cs: 'Nemůžete smazat svůj vlastní účet',
      en: 'You cannot delete your own account',
    },
  },
  success: {
    created: common.templates.success.created(userEntity),
    deleted: common.templates.success.deleted(userEntity),
  },
  validation: {
    emailRequired: common.templates.validation.required(
      { cs: 'Emailová adresa', en: 'Email address' },
      'fem'
    ),
    invalidEmail: common.templates.validation.invalidEmail,
    roleRequired: {
      cs: 'Vyberte roli',
      en: 'Please select a role',
    },
  },
  title: {
    cs: 'Seznam uživatelů',
    en: 'User List',
  },
  menuItem: {
    cs: 'Správa uživatelů',
    en: 'User Management',
  },
  addUser: {
    cs: 'Přidat uživatele',
    en: 'Add User',
  },
  addUserButton: {
    cs: 'Nový uživatel',
    en: 'New User',
  },
  searchPlaceholder: {
    cs: 'Hledat uživatele...',
    en: 'Search users...',
  },
  emailLabel: {
    cs: 'Email',
    en: 'Email',
  },
  roleLabel: {
    cs: 'Role',
    en: 'Role',
  },
  submit: {
    cs: 'Vytvořit',
    en: 'Create',
  },
  table: {
    name: {
      cs: 'Jméno',
      en: 'Name',
    },
    email: {
      cs: 'Email',
      en: 'Email',
    },
    role: {
      cs: 'Role',
      en: 'Role',
    },
    actions: {
      cs: 'Akce',
      en: 'Actions',
    },
    deleteButton: {
      cs: 'Smazat',
      en: 'Delete',
    },
    deleteConfirmTitle: {
      cs: 'Potvrdit smazání',
      en: 'Confirm Deletion',
    },
    deleteConfirmMessage: {
      cs: 'Opravdu chcete smazat uživatele',
      en: 'Are you sure you want to delete user',
    },
    roles: {
      admin: {
        cs: 'Administrátor',
        en: 'Administrator',
      },
      teacher: {
        cs: 'Učitel',
        en: 'Teacher',
      },
      parent: {
        cs: 'Rodič',
        en: 'Parent',
      },
    },
  },
};
