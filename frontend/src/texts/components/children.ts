import { common, type Entity } from './common';

const childEntity: Entity = {
  label: { cs: 'Dítě', en: 'Child' },
  accusative: 'dítě',
  gender: 'neut',
};

export const children = {
  errors: {
    fetchFailed: {
      title: {
        cs: 'Chyba při načítání dětí',
        en: 'Error loading children',
      },
      description: {
        cs: 'Nepodařilo se načíst seznam dětí. Zkuste to prosím později.',
        en: 'Failed to load children list. Please try again later.',
      },
    },
    updateFailed: {
      title: {
        cs: 'Chyba při aktualizaci dítěte',
        en: 'Error updating child',
      },
      description: {
        cs: 'Nepodařilo se aktualizovat informace o dítěti. Zkuste to prosím znovu.',
        en: 'Failed to update child information. Please try again.',
      },
    },
    deleteFailed: {
      title: {
        cs: 'Chyba při mazání dítěte',
        en: 'Error deleting child',
      },
      description: {
        cs: 'Nepodařilo se smazat dítě. Zkuste to prosím znovu.',
        en: 'Failed to delete child. Please try again.',
      },
    },
    addFailed: common.templates.errors.failedToAdd(childEntity),
    noSuitableClassForAge: {
      cs: 'Pro tento věk není k dispozici žádná třída',
      en: 'No class available for this age',
    },
    documentUploadFailed: {
      title: {
        cs: 'Chyba při nahrávání dokumentu',
        en: 'Error uploading document',
      },
      description: {
        cs: 'Nahrání souboru se nezdařilo. Zkuste to prosím znovu.',
        en: 'File upload failed. Please try again.',
      },
    },
    documentDeleteFailed: {
      title: {
        cs: 'Chyba při mazání dokumentu',
        en: 'Error deleting document',
      },
      description: {
        cs: 'Smazání dokumentu se nezdařilo. Zkuste to prosím znovu.',
        en: 'Failed to delete document. Please try again.',
      },
    },
    excuseSubmitFailed: {
      cs: 'Nepodařilo se odeslat omluvenku',
      en: 'Failed to submit excuse',
    },
    excuseCancelFailed: {
      cs: 'Nepodařilo se zrušit omluvenku',
      en: 'Failed to cancel excuse',
    },
  },
  success: {
    added: common.templates.success.added(childEntity),
    updated: common.templates.success.updated(childEntity),
    deleted: common.templates.success.deleted(childEntity),
    documentUploaded: {
      cs: 'Dokument byl úspěšně nahrán.',
      en: 'Document uploaded successfully.',
    },
    documentDeleted: {
      cs: 'Dokument byl úspěšně smazán.',
      en: 'Document deleted successfully.',
    },
    excuseSubmitted: {
      cs: 'Omluvenka byla odeslána',
      en: 'Excuse submitted',
    },
    excuseCancelled: {
      cs: 'Omluvenka byla zrušena',
      en: 'Excuse cancelled',
    },
  },
  validation: {
    firstNameLength: common.templates.validation.minLength({ cs: 'Jméno', en: 'First name' }, 2),
    firstNameMaxLength: common.templates.validation.maxLength(
      { cs: 'Jméno', en: 'First name' },
      100
    ),
    surnameLength: common.templates.validation.minLength({ cs: 'Příjmení', en: 'Surname' }, 2),
    surnameMaxLength: common.templates.validation.maxLength({ cs: 'Příjmení', en: 'Surname' }, 100),
    notesMaxLength: common.templates.validation.maxLength({ cs: 'Poznámky', en: 'Notes' }, 1000),
    documentTitleMaxLength: common.templates.validation.maxLength(
      { cs: 'Název dokumentu', en: 'Document title' },
      200
    ),
    documentDescriptionMaxLength: common.templates.validation.maxLength(
      { cs: 'Popis', en: 'Description' },
      1000
    ),
    documentFileRequired: {
      cs: 'Vyberte soubor k nahrání',
      en: 'Please select a file to upload',
    },
    documentFileTooLarge: {
      cs: 'Soubor je příliš velký. Maximální povolená velikost je 5 MB.',
      en: 'File is too large. Maximum allowed size is 5 MB.',
    },
    documentInvalidFileType: {
      cs: 'Nepodporovaný typ souboru. Povolené formáty: PDF, DOC, DOCX, TXT, PNG, JPG.',
      en: 'Unsupported file type. Allowed formats: PDF, DOC, DOCX, TXT, PNG, JPG.',
    },
    dateFormat: {
      cs: 'Neplatný formát data. Použijte RRRR-MM-DD',
      en: 'Invalid date format. Use YYYY-MM-DD',
    },
    parentRequired: {
      cs: 'Vyberte alespoň jednoho rodiče',
      en: 'Please select at least one parent',
    },
    classRequired: {
      cs: 'Vyberte třídu',
      en: 'Please select a class',
    },
    excuseDateFromRequired: {
      cs: 'Zadejte datum od',
      en: 'Please select a start date',
    },
    excuseDateToRequired: {
      cs: 'Zadejte datum do',
      en: 'Please select an end date',
    },
    excuseDateOrder: {
      cs: 'Datum do musí být po datu od',
      en: 'End date must be on or after start date',
    },
    excuseReasonRequired: {
      cs: 'Zadejte důvod omluvenky',
      en: 'Please provide a reason',
    },
  },
  backButton: {
    cs: 'Zpět',
    en: 'Back',
  },
  menuItem: {
    cs: 'Moje děti',
    en: 'My Children',
  },
  viewDashboard: {
    cs: 'Zobrazit panel dětí',
    en: "View Children's Dashboard",
  },
  titleParent: {
    cs: 'Moje děti',
    en: 'My Children',
  },
  title: {
    cs: 'Přehled',
    en: 'Overview',
  },
  noChildren: {
    cs: 'Zatím nemáte přiřazené žádné děti',
    en: 'No children assigned yet',
  },
  dateOfBirth: {
    cs: 'Datum narození',
    en: 'Date of Birth',
  },
  addChild: {
    title: {
      cs: 'Přidat dítě',
      en: 'Add Child',
    },
    submit: {
      cs: 'Přidat',
      en: 'Add',
    },
  },
  editChild: {
    title: {
      cs: 'Upravit dítě',
      en: 'Edit Child',
    },
  },
  deleteConfirm: {
    title: {
      cs: 'Smazat dítě',
      en: 'Delete Child',
    },
    message: {
      cs: 'Opravdu chcete smazat',
      en: 'Are you sure you want to delete',
    },
  },
  classSelection: {
    loading: {
      cs: 'Načítání dostupných tříd...',
      en: 'Loading available classes...',
    },
    noneFound: {
      cs: 'Pro tento věk nebyly nalezeny žádné vhodné třídy.',
      en: 'No suitable classes found for this age.',
    },
  },
  excuse: {
    historyTitle: {
      cs: 'Omluvenky',
      en: 'Excuses',
    },
    editTitle: {
      cs: 'Upravit omluvenku',
      en: 'Edit Excuse',
    },
    historyEmpty: {
      cs: 'Žádné omluvenky k zobrazení.',
      en: 'No excuses to display.',
    },
    excuseButton: {
      cs: 'Omluvit nepřítomnost',
      en: 'Excuse Absence',
    },
    excuseEditButton: {
      cs: 'Upravit omluvenku',
      en: 'Edit Excuse',
    },
    excuseEndButton: {
      cs: 'Zrušit omluvenku',
      en: 'Cancel Excuse',
    },
    edit: {
      cs: 'Upravit',
      en: 'Edit',
    },
    actions: {
      cs: 'Akce',
      en: 'Actions',
    },
    title: {
      cs: 'Omluvenka',
      en: 'Excuse from School',
    },
    dateFrom: {
      cs: 'Od',
      en: 'From',
    },
    dateTo: {
      cs: 'Do',
      en: 'To',
    },
    dateRange: {
      cs: 'Datum od - do',
      en: 'Date From - To',
    },
    submittedBy: {
      cs: 'Zadal/a',
      en: 'Submitted by',
    },
    status: {
      cs: 'Omluven/a',
      en: 'Excused',
    },
    reason: {
      cs: 'Důvod',
      en: 'Reason',
    },
    submit: {
      cs: 'Odeslat omluvenku',
      en: 'Submit Excuse',
    },
    cancelConfirmTitle: {
      cs: 'Zrušit omluvenku',
      en: 'Cancel Excuse',
    },
    cancelConfirmMessage: {
      cs: 'Opravdu chcete zrušit tuto omluvenku?',
      en: 'Are you sure you want to cancel this excuse?',
    },
    keep: {
      cs: 'Nezrušit',
      en: 'Keep Excuse',
    },
  },
  documents: {
    title: {
      cs: 'Dokumenty',
      en: 'Documents',
    },
    description: {
      cs: 'Správa dokumentů pro děti a třídy.',
      en: 'Manage documents for children and classes.',
    },
    documentTitle: {
      cs: 'Název dokumentu',
      en: 'Document Title',
    },
    documentDescription: {
      cs: 'Popis',
      en: 'Description',
    },
    file: {
      cs: 'Soubor',
      en: 'File',
    },
    type: {
      cs: 'Typ',
      en: 'Type',
    },
    createdAt: {
      cs: 'Vytvořeno',
      en: 'Created At',
    },
    noDocuments: {
      cs: 'Žádné dokumenty k zobrazení.',
      en: 'No documents to display.',
    },
    uploadDocument: {
      cs: 'Nahrát dokument',
      en: 'Upload Document',
    },
    deleteConfirmation: {
      cs: 'Smazat dokument',
      en: 'Delete Document',
    },
    deleteMessage: {
      cs: 'Opravdu chcete smazat tento dokument?',
      en: 'Are you sure you want to delete this document?',
    },
    placeholder: {
      dragDrop: {
        cs: 'Přetáhněte sem soubor',
        en: 'Drag and drop file here',
      },
      orClick: {
        cs: 'nebo klikněte pro výběr',
        en: 'or click to browse',
      },
      title: {
        cs: 'Zadejte název dokumentu...',
        en: 'Enter document title...',
      },
      description: {
        cs: 'Zadejte popis dokumentu...',
        en: 'Enter document description...',
      },
      name: {
        cs: 'Zadejte název dokumentu...',
        en: 'Enter document name...',
      },
    },
  },
};
