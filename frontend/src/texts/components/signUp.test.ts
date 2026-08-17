import { signUp } from './signUp';

describe('signUp texts', () => {
  it('matches the original auth.signUp.validation wording via common templates', () => {
    expect(signUp.validation.firstNameMinLength).toEqual({
      cs: 'Jméno musí mít alespoň 2 znaky',
      en: 'First name must be at least 2 characters',
    });
    expect(signUp.validation.lastNameMinLength).toEqual({
      cs: 'Příjmení musí mít alespoň 2 znaky',
      en: 'Last name must be at least 2 characters',
    });
    expect(signUp.validation.passwordLength).toEqual({
      cs: 'Heslo musí mít alespoň 8 znaků',
      en: 'Password must be at least 8 characters',
    });
  });
});
