import { profile } from './profile';
import { login } from './login';

describe('profile texts', () => {
  it('matches the original top-level success/passwordChanged/passwordError wording', () => {
    expect(profile.success.updated).toEqual({
      cs: 'Profil byl úspěšně aktualizován',
      en: 'Profile updated successfully',
    });
    expect(profile.success.passwordChanged).toEqual({
      cs: 'Heslo bylo úspěšně změněno',
      en: 'Password changed successfully',
    });
    expect(profile.errors.passwordChangeFailed).toEqual({
      cs: 'Nepodařilo se změnit heslo',
      en: 'Failed to change password',
    });
  });

  it('matches the original error.title/notificationsUpdateFailed wording, and fixes a CS/EN mismatch in notificationsUpdated (CS was missing "úspěšně"/successfully that EN already had)', () => {
    expect(profile.errors.updateFailed.title).toEqual({
      cs: 'Nepodařilo se aktualizovat profil',
      en: 'Failed to update profile',
    });
    expect(profile.success.notificationsUpdated).toEqual({
      cs: 'Nastavení upozornění bylo úspěšně aktualizováno',
      en: 'Notification settings updated successfully',
    });
    expect(profile.errors.notificationsUpdateFailed).toEqual({
      cs: 'Nepodařilo se aktualizovat nastavení upozornění',
      en: 'Failed to update notification settings',
    });
  });

  it('keeps profile.validation.emailRequired/invalidEmail identical to login.validation (both derive from the same common source, so a login-domain schema reaching into either gets the same text)', () => {
    expect(profile.validation.emailRequired).toEqual(login.validation.emailRequired);
    expect(profile.validation.invalidEmail).toEqual(login.validation.invalidEmail);
    expect(profile.validation.emailRequired).toEqual({
      cs: 'Emailová adresa je povinná',
      en: 'Email address is required',
    });
  });

  it('keeps newPasswordLength identical between profile (change-password form) and login (reset-password form)', () => {
    expect(profile.validation.newPasswordLength).toEqual(login.validation.newPasswordLength);
    expect(profile.validation.newPasswordLength).toEqual({
      cs: 'Nové heslo musí mít alespoň 8 znaků',
      en: 'New password must be at least 8 characters',
    });
  });
});
