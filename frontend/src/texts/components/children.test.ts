import { children } from './children';

describe('children texts', () => {
  it('matches the original child.ts / profile.children.* wording for generated messages', () => {
    expect(children.success.added).toEqual({
      cs: 'Dítě bylo úspěšně přidáno',
      en: 'Child added successfully',
    });
    expect(children.success.updated).toEqual({
      cs: 'Dítě bylo úspěšně aktualizováno',
      en: 'Child updated successfully',
    });
    expect(children.success.deleted).toEqual({
      cs: 'Dítě bylo úspěšně smazáno',
      en: 'Child deleted successfully',
    });
  });

  it('matches childSchema.ts validation wording', () => {
    expect(children.validation.firstNameLength).toEqual({
      cs: 'Jméno musí mít alespoň 2 znaky',
      en: 'First name must be at least 2 characters',
    });
    expect(children.validation.firstNameMaxLength).toEqual({
      cs: 'Jméno nesmí být delší než 100 znaků',
      en: 'First name must not exceed 100 characters',
    });
  });
});
