export type Gender = 'masc' | 'fem' | 'neut';

export type Entity = {
  label: { cs: string; en: string };
  accusative: string;
  gender: Gender;
};

const beSuffix: Record<Gender, string> = { masc: '', fem: 'a', neut: 'o' };
const participleSuffix = beSuffix;
const requiredAdjective: Record<Gender, string> = {
  masc: 'povinný',
  fem: 'povinná',
  neut: 'povinné',
};

const characterCountNoun = (n: number) => {
  if (n === 1) return 'znak';
  if (n >= 2 && n <= 4) return 'znaky';
  return 'znaků';
};

const successPhrase = (participleStem: string, verbEn: string, entity: Entity) => ({
  cs: `${entity.label.cs} byl${beSuffix[entity.gender]} úspěšně ${participleStem}${participleSuffix[entity.gender]}`,
  en: `${entity.label.en} ${verbEn} successfully`,
});

const failedToPhrase = (verbCs: string, verbEn: string, entity: Entity) => ({
  cs: `Nepodařilo se ${verbCs} ${entity.accusative}`,
  en: `Failed to ${verbEn} ${entity.label.en.toLowerCase()}`,
});

export const common = {
  unknownError: {
    cs: 'Nastala neznámá chyba',
    en: 'An unknown error occurred',
  },
  genericError: {
    title: {
      cs: 'Nastala chyba',
      en: 'An error occurred',
    },
    description: {
      cs: 'Zkuste to prosím později.',
      en: 'Please try again later.',
    },
  },
  entities: {} as Record<string, Entity>,
  templates: {
    success: {
      created: (entity: Entity) => successPhrase('vytvořen', 'created', entity),
      updated: (entity: Entity) => successPhrase('aktualizován', 'updated', entity),
      deleted: (entity: Entity) => successPhrase('smazán', 'deleted', entity),
      added: (entity: Entity) => successPhrase('přidán', 'added', entity),
      changed: (entity: Entity) => successPhrase('změněn', 'changed', entity),
    },
    errors: {
      failedToLoad: (entity: Entity) => failedToPhrase('načíst', 'load', entity),
      failedToCreate: (entity: Entity) => failedToPhrase('vytvořit', 'create', entity),
      failedToUpdate: (entity: Entity) => failedToPhrase('aktualizovat', 'update', entity),
      failedToDelete: (entity: Entity) => failedToPhrase('smazat', 'delete', entity),
      failedToAdd: (entity: Entity) => failedToPhrase('přidat', 'add', entity),
      failedToChange: (entity: Entity) => failedToPhrase('změnit', 'change', entity),
    },
    validation: {
      required: (fieldLabel: { cs: string; en: string }, gender: Gender) => ({
        cs: `${fieldLabel.cs} je ${requiredAdjective[gender]}`,
        en: `${fieldLabel.en} is required`,
      }),
      minLength: (fieldLabel: { cs: string; en: string }, n: number) => ({
        cs: `${fieldLabel.cs} musí mít alespoň ${n} ${characterCountNoun(n)}`,
        en: `${fieldLabel.en} must be at least ${n} characters`,
      }),
      maxLength: (fieldLabel: { cs: string; en: string }, n: number) => ({
        cs: `${fieldLabel.cs} nesmí být delší než ${n} ${characterCountNoun(n)}`,
        en: `${fieldLabel.en} must not exceed ${n} characters`,
      }),
      invalidEmail: {
        cs: 'Zadejte platnou emailovou adresu',
        en: 'Please enter a valid email address',
      },
    },
  },
  dashboard: {
    title: {
      cs: 'Naši školáci',
      en: 'Our Students',
    },
  },
  pagination: {
    page: {
      cs: 'Stránka',
      en: 'Page',
    },
    previous: {
      cs: 'Předchozí',
      en: 'Previous',
    },
    next: {
      cs: 'Další',
      en: 'Next',
    },
    showing: {
      cs: 'Zobrazuji',
      en: 'Showing',
    },
    to: {
      cs: 'do',
      en: 'to',
    },
    ofPage: {
      cs: 'z',
      en: 'of',
    },
  },
  childrenTable: {
    firstname: {
      cs: 'Jméno',
      en: 'First Name',
    },
    surname: {
      cs: 'Příjmení',
      en: 'Surname',
    },
    name: {
      cs: 'Jméno a příjmení',
      en: 'Name',
    },
    age: {
      cs: 'Věk',
      en: 'Age',
    },
    class: {
      cs: 'Třída',
      en: 'Class',
    },
    noClass: {
      cs: 'Dítě není přiřazeno do žádné třídy',
      en: 'Child is not assigned to any class',
    },
    parent: {
      cs: 'Rodič',
      en: 'Parent',
    },
    parentEmail: {
      cs: 'Email rodiče',
      en: 'Parent Email',
    },
    contact: {
      cs: 'Kontakt na rodiče',
      en: 'Parent Contact',
    },
    notes: {
      cs: 'Poznámka',
      en: 'Notes',
    },
  },
  colorModeToggle: {
    light: {
      cs: 'Přepnout na světlý režim',
      en: 'Switch to Light Mode',
    },
    dark: {
      cs: 'Přepnout na tmavý režim',
      en: 'Switch to Dark Mode',
    },
  },
  communication: {
    title: {
      cs: 'Komunikace',
      en: 'Communication',
    },
    messages: {
      cs: 'Zprávy',
      en: 'Messages',
    },
    progress: {
      cs: 'Pokrok dítěte',
      en: "Child's Progress",
    },
    activities: {
      cs: 'Denní aktivity',
      en: 'Daily Activities',
    },
    newMessage: {
      cs: 'Nová zpráva',
      en: 'New Message',
    },
  },
  datePicker: {
    months: {
      cs: [
        'Leden',
        'Únor',
        'Březen',
        'Duben',
        'Květen',
        'Červen',
        'Červenec',
        'Srpen',
        'Září',
        'Říjen',
        'Listopad',
        'Prosinec',
      ],
      en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
    weekdays: {
      cs: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
      en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    openPicker: {
      cs: 'Otevřít výběr datumu',
      en: 'Open date picker',
    },
    selectWeek: {
      cs: 'Klikněte na libovolný den pro výběr týdne',
      en: 'Click any day to select the week',
    },
    selectMonth: {
      cs: 'Vyberte měsíc',
      en: 'Select month',
    },
    selectDate: {
      cs: 'Vyberte datum',
      en: 'Select date',
    },
    clear: {
      cs: 'Vymazat',
      en: 'Clear',
    },
    thisMonth: {
      cs: 'Tento měsíc',
      en: 'This Month',
    },
    today: {
      cs: 'Dnes',
      en: 'Today',
    },
    previousMonth: {
      cs: 'Předchozí měsíc',
      en: 'Previous Month',
    },
    previousYear: {
      cs: 'Předchozí rok',
      en: 'Previous Year',
    },
    nextMonth: {
      cs: 'Následující měsíc',
      en: 'Next Month',
    },
    nextYear: {
      cs: 'Následující rok',
      en: 'Next Year',
    },
  },
  actions: {
    cs: 'Akce',
    en: 'Actions',
  },
  select: {
    cs: 'Vyberte',
    en: 'Select',
  },
  delete: {
    cs: 'Smazat',
    en: 'Delete',
  },
  refresh: {
    cs: 'Obnovit',
    en: 'Refresh',
  },
  edit: {
    cs: 'Upravit',
    en: 'Edit',
  },
  save: {
    cs: 'Uložit',
    en: 'Save',
  },
  cancel: {
    cs: 'Zrušit',
    en: 'Cancel',
  },
};
