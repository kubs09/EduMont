import { schedule } from './schedule';

describe('schedule texts', () => {
  it('matches the original messages.createSuccess/updateSuccess/deleteSuccess wording', () => {
    expect(schedule.success.created).toEqual({
      cs: 'Položka rozvrhu byla úspěšně vytvořena',
      en: 'Presentation entry created successfully',
    });
    expect(schedule.success.updated).toEqual({
      cs: 'Položka rozvrhu byla úspěšně aktualizována',
      en: 'Presentation entry updated successfully',
    });
    expect(schedule.success.deleted).toEqual({
      cs: 'Položka rozvrhu byla úspěšně smazána',
      en: 'Presentation entry deleted successfully',
    });
  });

  it('matches the original messages.createError/updateError/deleteError wording', () => {
    expect(schedule.errors.createFailed).toEqual({
      cs: 'Nepodařilo se vytvořit položku rozvrhu',
      en: 'Failed to create presentation entry',
    });
    expect(schedule.errors.updateFailed).toEqual({
      cs: 'Nepodařilo se aktualizovat položku rozvrhu',
      en: 'Failed to update presentation entry',
    });
    expect(schedule.errors.deleteFailed.title).toEqual({
      cs: 'Nepodařilo se smazat položku rozvrhu',
      en: 'Failed to delete presentation entry',
    });
  });

  it('keeps the delete confirmation question distinct from the delete-failure description (they were accidentally conflated during editing and then fixed)', () => {
    expect(schedule.curriculum.deleteConfirmMessage).toEqual({
      cs: 'Opravdu chcete smazat tuto položku rozvrhu?',
      en: 'Are you sure you want to delete this presentation entry?',
    });
    expect(schedule.errors.deleteFailed.description).toEqual({
      cs: 'Nepodařilo se smazat položku rozvrhu. Zkuste to prosím znovu.',
      en: 'Failed to delete presentation entry. Please try again.',
    });
  });

  it('fixes the original messages.fetchError CS/EN mismatch (CS said "rozvrh"/schedule, EN said "presentation")', () => {
    expect(schedule.errors.fetchFailed).toEqual({
      cs: 'Nepodařilo se načíst rozvrh',
      en: 'Failed to load schedule',
    });
  });

  it('standardizes nameMinLength/nameMaxLength/notesMaxLength wording via common templates', () => {
    expect(schedule.validation.nameMinLength).toEqual({
      cs: 'Název prezentace musí mít alespoň 2 znaky',
      en: 'Presentation name must be at least 2 characters',
    });
    expect(schedule.validation.nameMaxLength).toEqual({
      cs: 'Název prezentace nesmí být delší než 100 znaků',
      en: 'Presentation name must not exceed 100 characters',
    });
    expect(schedule.validation.notesMaxLength).toEqual({
      cs: 'Poznámky nesmí být delší než 500 znaků',
      en: 'Notes must not exceed 500 characters',
    });
  });
});
