import { userDashboard } from './userDashboard';

describe('userDashboard texts', () => {
  it('matches the original userDashboard.success / userTable.deleteSuccess/deleteError wording', () => {
    expect(userDashboard.success.created).toEqual({
      cs: 'Uživatel byl úspěšně vytvořen',
      en: 'User created successfully',
    });
    expect(userDashboard.success.deleted).toEqual({
      cs: 'Uživatel byl úspěšně smazán',
      en: 'User deleted successfully',
    });
    expect(userDashboard.errors.deleteFailed).toEqual({
      cs: 'Nepodařilo se smazat uživatele',
      en: 'Failed to delete user',
    });
  });

  it('adds a proper createFailed message (previously the create-user flow fell back to a bare "Error" title with no detail)', () => {
    expect(userDashboard.errors.createFailed).toEqual({
      cs: 'Nepodařilo se vytvořit uživatele',
      en: 'Failed to create user',
    });
  });
});
