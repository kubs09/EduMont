import { common, type Entity } from './common';

const scheduleEntity: Entity = {
  label: { cs: 'Rozvrh', en: 'Schedule' },
  accusative: 'rozvrh',
  gender: 'masc',
};

const scheduleEntryEntity: Entity = {
  label: { cs: 'Položka rozvrhu', en: 'Presentation entry' },
  accusative: 'položku rozvrhu',
  gender: 'fem',
};

export const schedule = {
  errors: {
    fetchFailed: common.templates.errors.failedToLoad(scheduleEntity),
    createFailed: common.templates.errors.failedToCreate(scheduleEntryEntity),
    updateFailed: common.templates.errors.failedToUpdate(scheduleEntryEntity),
    deleteFailed: {
      title: common.templates.errors.failedToDelete(scheduleEntryEntity),
      description: {
        cs: 'Nepodařilo se smazat položku rozvrhu. Zkuste to prosím znovu.',
        en: 'Failed to delete presentation entry. Please try again.',
      },
    },
    reorderFailed: {
      cs: 'Nepodařilo se aktualizovat pořadí',
      en: 'Failed to update order',
    },
    reorderLimitReached: {
      cs: 'Nelze přeřadit mimo limity',
      en: 'Cannot reorder beyond limits',
    },
    childNotFound: {
      cs: 'Dítě nebylo nalezeno',
      en: 'Child not found',
    },
  },
  success: {
    created: common.templates.success.created(scheduleEntryEntity),
    updated: common.templates.success.updated(scheduleEntryEntity),
    deleted: common.templates.success.deleted(scheduleEntryEntity),
    reordered: {
      cs: 'Pořadí bylo aktualizováno',
      en: 'Order updated successfully',
    },
  },
  validation: {
    categoryValid: {
      cs: 'Kategorie musí být text',
      en: 'Category must be text',
    },
    categoryRequired: {
      cs: 'Vyberte kategorii',
      en: 'Please select a category',
    },
    categoryTooLong: {
      cs: 'Kategorie je příliš dlouhá',
      en: 'Category is too long',
    },
    nameRequired: {
      cs: 'Zadejte název prezentace',
      en: 'Please enter the presentation name',
    },
    nameMinLength: common.templates.validation.minLength(
      { cs: 'Název prezentace', en: 'Presentation name' },
      2
    ),
    nameMaxLength: common.templates.validation.maxLength(
      { cs: 'Název prezentace', en: 'Presentation name' },
      100
    ),
    nameTooLong: {
      cs: 'Název prezentace je příliš dlouhý',
      en: 'Presentation name is too long',
    },
    ageGroupValid: {
      cs: 'Věková skupina musí být vybrána',
      en: 'Age group must be a valid option',
    },
    ageGroupRequired: {
      cs: 'Vyberte věkovou skupinu',
      en: 'Please select an age group',
    },
    orderValid: {
      cs: 'Pořadí musí být kladné číslo',
      en: 'Order must be a positive number',
    },
    selectCategoryFirst: {
      cs: 'Nejdříve vyberte kategorii',
      en: 'Please select a category first',
    },
    notesMaxLength: common.templates.validation.maxLength({ cs: 'Poznámky', en: 'Notes' }, 500),
    childRequired: {
      cs: 'Vyberte dítě',
      en: 'Please select a child',
    },
    classRequired: {
      cs: 'Vyberte třídu',
      en: 'Please select a class',
    },
  },
  menuItem: {
    cs: 'Rozvrh',
    en: 'Presentation',
  },
  title: {
    cs: 'Rozvrh',
    en: 'Presentation',
  },
  status: {
    label: {
      cs: 'Stav',
      en: 'Status',
    },
    changeStatus: {
      cs: 'Změnit stav',
      en: 'Change Status',
    },
    options: {
      prerequisitesNotMet: {
        cs: 'Nesplněné předpoklady',
        en: 'Prerequisites Not Met',
      },
      toBePresented: {
        cs: 'K představení',
        en: 'To Be Presented',
      },
      presented: {
        cs: 'Představeno',
        en: 'Presented',
      },
      practiced: {
        cs: 'Procvičováno',
        en: 'Practiced',
      },
      mastered: {
        cs: 'Zvládnuto',
        en: 'Mastered',
      },
    },
  },
  name: {
    cs: 'Název',
    en: 'Name',
  },
  category: {
    cs: 'Kategorie',
    en: 'Category',
  },
  addEntry: {
    cs: 'Přidat položku',
    en: 'Add Entry',
  },
  editEntry: {
    cs: 'Upravit položku',
    en: 'Edit Entry',
  },
  deleteEntry: {
    cs: 'Smazat položku',
    en: 'Delete Entry',
  },
  notes: {
    cs: 'Poznámky',
    en: 'Notes',
  },
  child: {
    cs: 'Dítě',
    en: 'Child',
  },
  class: {
    cs: 'Třída',
    en: 'Class',
  },
  ageGroup: {
    cs: 'Věková skupina',
    en: 'Age Group',
  },
  order: {
    cs: 'Pořadí',
    en: 'Order',
  },
  noEntries: {
    cs: 'Žádné položky rozvrhu',
    en: 'No presentation entries',
  },
  curriculum: {
    curriculumManagement: {
      cs: 'Správa Kurikula',
      en: 'Curriculum Management',
    },
    addPresentation: {
      cs: 'Přidat prezentaci',
      en: 'Add presentation',
    },
    editPresentation: {
      cs: 'Upravit prezentaci',
      en: 'Edit presentation',
    },
    deletePresentation: {
      cs: 'Smazat prezentaci',
      en: 'Delete presentation',
    },
    deleteConfirmMessage: {
      cs: 'Opravdu chcete smazat tuto položku rozvrhu?',
      en: 'Are you sure you want to delete this presentation entry?',
    },
    moveUp: {
      cs: 'Posunout nahoru',
      en: 'Move up',
    },
    moveDown: {
      cs: 'Posunout dolů',
      en: 'Move down',
    },
  },
  placeholders: {
    notes: {
      cs: 'Volitelné poznámky k této prezentaci...',
      en: 'Optional notes for this presentation...',
    },
    name: {
      cs: 'Zadejte název prezentace',
      en: 'Enter presentation name',
    },
    category: {
      cs: 'Zadejte kategorii (např. Předmět, Volný čas...)',
      en: 'Enter category (e.g. Subject, Leisure...)',
    },
  },
};
