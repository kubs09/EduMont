import { messages } from './messages';

describe('messages texts', () => {
  it('matches the original messageSent/messageDeleted/error.deleteError wording', () => {
    expect(messages.success.sent).toEqual({
      cs: 'Zpráva byla úspěšně odeslána',
      en: 'Message sent successfully',
    });
    expect(messages.success.deleted).toEqual({
      cs: 'Zpráva byla úspěšně smazána',
      en: 'Message deleted successfully',
    });
    expect(messages.errors.deleteFailed).toEqual({
      cs: 'Nepodařilo se smazat zprávu',
      en: 'Failed to delete message',
    });
  });

  it('matches the original validation.subject/content required wording', () => {
    expect(messages.validation.subject).toEqual({
      cs: 'Předmět je povinný',
      en: 'Subject is required',
    });
    expect(messages.validation.content).toEqual({
      cs: 'Obsah zprávy je povinný',
      en: 'Message content is required',
    });
  });

  it('standardizes maxLength wording to "nesmí být delší než" / "must not exceed", matching children.ts/classes.ts (was "musí být kratší než" / "must be less than")', () => {
    expect(messages.validation.subjectMaxLength).toEqual({
      cs: 'Předmět nesmí být delší než 255 znaků',
      en: 'Subject must not exceed 255 characters',
    });
    expect(messages.validation.contentMaxLength).toEqual({
      cs: 'Obsah zprávy nesmí být delší než 5000 znaků',
      en: 'Message content must not exceed 5000 characters',
    });
  });
});
