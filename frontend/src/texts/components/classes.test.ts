import { classes } from './classes';

describe('classes texts', () => {
  it('matches the original createSuccess/updateSuccess/createError/updateError wording', () => {
    expect(classes.success.updated).toEqual({
      cs: 'Třída byla úspěšně aktualizována',
      en: 'Class updated successfully',
    });
    expect(classes.errors.createFailed).toEqual({
      cs: 'Nepodařilo se vytvořit třídu',
      en: 'Failed to create class',
    });
    expect(classes.errors.updateFailed).toEqual({
      cs: 'Nepodařilo se aktualizovat třídu',
      en: 'Failed to update class',
    });
  });

  it('fixes the pre-existing Czech numeral agreement bug in classDescriptionMin (was "5 znaky", should be "5 znaků") and standardizes "musí mít" to match every other domain', () => {
    expect(classes.validation.classDescriptionMin.cs).toBe('Popis třídy musí mít alespoň 5 znaků');
  });

  it('standardizes classNameMin wording to "musí mít alespoň", matching children.ts/auth.ts/profile.ts', () => {
    expect(classes.validation.classNameMin.cs).toBe('Název třídy musí mít alespoň 2 znaky');
  });

  it('generates the interpolated permission-request message', () => {
    expect(classes.detail.permissionRequestFrom('Jana Nováková')).toEqual({
      cs: 'Administrátor Jana Nováková žádá o oprávnění k prezentacím.',
      en: 'Administrator Jana Nováková has requested permission to access presentations.',
    });
  });
});
