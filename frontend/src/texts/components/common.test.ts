import { common, type Entity } from './common';

const classEntity: Entity = {
  label: { cs: 'Třída', en: 'Class' },
  accusative: 'třídu',
  gender: 'fem',
};

const userEntity: Entity = {
  label: { cs: 'Uživatel', en: 'User' },
  accusative: 'uživatele',
  gender: 'masc',
};

const childEntity: Entity = {
  label: { cs: 'Dítě', en: 'Child' },
  accusative: 'dítě',
  gender: 'neut',
};

describe('common.templates', () => {
  it('matches classes.ts createSuccess/updateSuccess wording', () => {
    expect(common.templates.success.created(classEntity)).toEqual({
      cs: 'Třída byla úspěšně vytvořena',
      en: 'Class created successfully',
    });
    expect(common.templates.success.updated(classEntity)).toEqual({
      cs: 'Třída byla úspěšně aktualizována',
      en: 'Class updated successfully',
    });
  });

  it('matches classes.ts createError/updateError wording', () => {
    expect(common.templates.errors.failedToCreate(classEntity)).toEqual({
      cs: 'Nepodařilo se vytvořit třídu',
      en: 'Failed to create class',
    });
    expect(common.templates.errors.failedToUpdate(classEntity)).toEqual({
      cs: 'Nepodařilo se aktualizovat třídu',
      en: 'Failed to update class',
    });
  });

  it('matches userTable.deleteSuccess/deleteError wording (masculine entity)', () => {
    expect(common.templates.success.deleted(userEntity)).toEqual({
      cs: 'Uživatel byl úspěšně smazán',
      en: 'User deleted successfully',
    });
    expect(common.templates.errors.failedToDelete(userEntity)).toEqual({
      cs: 'Nepodařilo se smazat uživatele',
      en: 'Failed to delete user',
    });
  });

  it('applies correct Czech numeral agreement in minLength', () => {
    expect(common.templates.validation.minLength({ cs: 'Jméno', en: 'First name' }, 2).cs).toBe(
      'Jméno musí mít alespoň 2 znaky'
    );
    expect(common.templates.validation.minLength({ cs: 'Heslo', en: 'Password' }, 8).cs).toBe(
      'Heslo musí mít alespoň 8 znaků'
    );
  });

  it('matches child.ts addTitle wording (neuter entity, "added" verb)', () => {
    expect(common.templates.success.added(childEntity)).toEqual({
      cs: 'Dítě bylo úspěšně přidáno',
      en: 'Child added successfully',
    });
    expect(common.templates.errors.failedToAdd(childEntity)).toEqual({
      cs: 'Nepodařilo se přidat dítě',
      en: 'Failed to add child',
    });
  });

  it('matches childSchema.ts firstNameMaxLength wording in maxLength', () => {
    expect(common.templates.validation.maxLength({ cs: 'Jméno', en: 'First name' }, 100).cs).toBe(
      'Jméno nesmí být delší než 100 znaků'
    );
    expect(common.templates.validation.maxLength({ cs: 'Jméno', en: 'First name' }, 100).en).toBe(
      'First name must not exceed 100 characters'
    );
  });

  it('applies gendered adjective agreement in required', () => {
    expect(common.templates.validation.required({ cs: 'Email', en: 'Email' }, 'masc').cs).toBe(
      'Email je povinný'
    );
    expect(
      common.templates.validation.required({ cs: 'Emailová adresa', en: 'Email address' }, 'fem').cs
    ).toBe('Emailová adresa je povinná');
    expect(common.templates.validation.required({ cs: 'Heslo', en: 'Password' }, 'neut').cs).toBe(
      'Heslo je povinné'
    );
  });
});
