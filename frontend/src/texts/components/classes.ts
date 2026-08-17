import { common, type Entity } from './common';

const classEntity: Entity = {
  label: { cs: 'Třída', en: 'Class' },
  accusative: 'třídu',
  gender: 'fem',
};

const permissionRequestFrom = (name: string) => ({
  cs: `Administrátor ${name} žádá o oprávnění k prezentacím.`,
  en: `Administrator ${name} has requested permission to access presentations.`,
});

export const classes = {
  errors: {
    fetchFailed: common.templates.errors.failedToLoad(classEntity),
    fetchClassesFailed: {
      cs: 'Nepodařilo se načíst třídy',
      en: 'Failed to fetch classes',
    },
    fetchTeachersFailed: {
      cs: 'Nepodařilo se načíst učitele',
      en: 'Failed to fetch teachers',
    },
    createFailed: common.templates.errors.failedToCreate(classEntity),
    updateFailed: common.templates.errors.failedToUpdate(classEntity),
    savingTeachersFailed: {
      cs: 'Nepodařilo se uložit učitele',
      en: 'Failed to save teachers',
    },
    permissionRequestFailed: {
      cs: 'Nepodařilo se odeslat žádost o oprávnění',
      en: 'Failed to send permission request',
    },
    permissionAcceptFailed: {
      cs: 'Nepodařilo se přijmout oprávnění',
      en: 'Failed to accept permission',
    },
    permissionDenyFailed: {
      cs: 'Nepodařilo se odmítnout oprávnění',
      en: 'Failed to deny permission',
    },
    attendanceFetchFailed: {
      cs: 'Nepodařilo se načíst docházku',
      en: 'Failed to load attendance',
    },
    checkInFailed: {
      cs: 'Nepodařilo se zapsat příchod',
      en: 'Failed to check in',
    },
    checkOutFailed: {
      cs: 'Nepodařilo se zapsat odchod',
      en: 'Failed to check out',
    },
  },
  success: {
    updated: common.templates.success.updated(classEntity),
    permissionRequestSent: {
      cs: 'Žádost o oprávnění byla odeslána',
      en: 'Permission request has been sent',
    },
    permissionAccepted: {
      cs: 'Oprávnění přijato',
      en: 'Permission accepted',
    },
    permissionDenied: {
      cs: 'Oprávnění odmítnuto',
      en: 'Permission denied',
    },
  },
  validation: {
    classNameRequired: common.templates.validation.required({ cs: 'Název třídy', en: 'Class name' }, 'masc'),
    classNameMin: common.templates.validation.minLength({ cs: 'Název třídy', en: 'Class name' }, 2),
    classNameMax: common.templates.validation.maxLength({ cs: 'Název třídy', en: 'Class name' }, 100),
    classDescriptionRequired: common.templates.validation.required(
      { cs: 'Popis třídy', en: 'Class description' },
      'masc',
    ),
    classDescriptionMin: common.templates.validation.minLength(
      { cs: 'Popis třídy', en: 'Class description' },
      5,
    ),
    classDescriptionMax: common.templates.validation.maxLength(
      { cs: 'Popis třídy', en: 'Class description' },
      500,
    ),
    teacherValid: {
      cs: 'Učitel musí být platná volba',
      en: 'Teacher must be a valid selection',
    },
    assistantValid: {
      cs: 'Asistent musí být platná volba',
      en: 'Assistant must be a valid selection',
    },
    teacherRequired: {
      cs: 'Třída musí mít alespoň jednoho učitele',
      en: 'Class must have at least one teacher',
    },
    assistantRequired: {
      cs: 'Třída musí mít alespoň jednoho asistenta',
      en: 'Class must have at least one assistant',
    },
    assistantSameAsTeacher: {
      cs: 'Asistent nesmí být stejný jako učitel',
      en: 'Assistant cannot be the same as the main teacher',
    },
    childRequired: {
      cs: 'Třída musí mít alespoň jedno dítě',
      en: 'Class must have at least one child',
    },
    teacherAlreadyAssigned: {
      cs: 'Tento učitel je již přiřazen k jiné třídě',
      en: 'This teacher is already assigned to another class',
    },
  },
  menuItem: {
    cs: 'Třídy',
    en: 'Classes',
  },
  teacherClassMenuItem: {
    cs: 'Moje třída',
    en: 'My Class',
  },
  teacherMenuItem: {
    cs: 'Moji studenti',
    en: 'My Students',
  },
  title: {
    cs: 'Seznam tříd',
    en: 'Class List',
  },
  addClass: {
    cs: 'Přidat třídu',
    en: 'Add Class',
  },
  noClasses: {
    cs: 'Žádné třídy k zobrazení',
    en: 'No classes to display',
  },
  name: {
    cs: 'Název třídy',
    en: 'Class Name',
  },
  description: {
    cs: 'Popis',
    en: 'Description',
  },
  teachers: {
    cs: 'Učitelé',
    en: 'Teachers',
  },
  teacher: {
    cs: 'Učitel',
    en: 'Teacher',
  },
  assistant: {
    cs: 'Asistent',
    en: 'Assistant',
  },
  student: {
    cs: 'Student',
    en: 'Student',
  },
  students: {
    cs: 'Studenti',
    en: 'Students',
  },
  selectClass: {
    cs: 'Vyberte třídu',
    en: 'Select Class',
  },
  selectTeacher: {
    cs: 'Vybrat učitele',
    en: 'Select Teacher',
  },
  selectAssistant: {
    cs: 'Vybrat asistenta',
    en: 'Select Assistant',
  },
  createClassTitle: {
    cs: 'Vytvořit třídu',
    en: 'Create Class',
  },
  createClass: {
    cs: 'Vytvořit',
    en: 'Create',
  },
  detail: {
    title: {
      cs: 'Detail třídy',
      en: 'Class Detail',
    },
    backToList: {
      cs: 'Zpět na seznam tříd',
      en: 'Back to Class List',
    },
    info: {
      cs: 'Informace o třídě',
      en: 'Class Information',
    },
    teacher: {
      cs: 'Učitel',
      en: 'Teacher',
    },
    students: {
      cs: 'Studenti',
      en: 'Students',
    },
    filterByChild: {
      cs: 'Filtrovat studenty',
      en: 'Filter Students',
    },
    history: {
      cs: 'Historie třídy',
      en: 'Class History',
    },
    date: {
      cs: 'Datum',
      en: 'Date',
    },
    notes: {
      cs: 'Poznámky',
      en: 'Notes',
    },
    createdBy: {
      cs: 'Vytvořil(a)',
      en: 'Created by',
    },
    addHistory: {
      cs: 'Přidat záznam',
      en: 'Add Entry',
    },
    notesPlaceholder: {
      cs: 'Zadejte poznámky k tomuto dni...',
      en: 'Enter notes for this day...',
    },
    myChildren: {
      cs: 'Moje děti',
      en: 'My Children',
    },
    nextPresentations: {
      cs: 'Následující prezentace',
      en: 'Next Presentations',
    },
    presentationsPermissionTitle: {
      cs: 'Vyžadováno oprávnění',
      en: 'Permission Required',
    },
    presentationsPermissionMessage: {
      cs: 'Pro zobrazení prezentací dětí potřebujete oprávnění učitele nebo asistenta.',
      en: 'You can view child presentations only with teacher or assistant permission.',
    },
    requestPermissionButton: {
      cs: 'Požádat o oprávnění',
      en: 'Request Permission',
    },
    requestSentButton: {
      cs: 'Žádost odeslána',
      en: 'Request Sent',
    },
    permissionAcceptButton: {
      cs: 'Přijmout oprávnění',
      en: 'Accept Permission',
    },
    permissionDenyButton: {
      cs: 'Odmítnout oprávnění',
      en: 'Deny Permission',
    },
    permissionRequestFrom,
    permissionRequestMessage: {
      cs: 'Administrátor požádal o oprávnění přístupu k prezentacím dětí v této třídě. Přijměte nebo odmítněte žádost.',
      en: 'An administrator has requested permission to access child presentations in this class. Please accept or deny the request.',
    },
    attendance: {
      cs: 'Docházka',
      en: 'Attendance',
    },
    noNextPresentations: {
      cs: 'Žádné naplánované prezentace',
      en: 'No scheduled presentations',
    },
    time: {
      cs: 'Čas',
      en: 'Time',
    },
    presentation: {
      cs: 'Prezentace',
      en: 'Presentation',
    },
    category: {
      cs: 'Kategorie',
      en: 'Category',
    },
    checkIn: {
      cs: 'Příchod',
      en: 'Check In',
    },
    checkOut: {
      cs: 'Odchod',
      en: 'Check Out',
    },
    notCheckedIn: {
      cs: 'Nezapsáno',
      en: 'Not checked in',
    },
    notCheckedOut: {
      cs: 'Nezapsáno',
      en: 'Not checked out',
    },
    attendanceDate: {
      cs: 'Datum docházky',
      en: 'Attendance date',
    },
    attendanceLoading: {
      cs: 'Načítám docházku...',
      en: 'Loading attendance...',
    },
  },
  editInfo: {
    cs: 'Upravit informace',
    en: 'Edit Info',
  },
  editClassTitle: {
    cs: 'Upravit informace o třídě',
    en: 'Edit Class Information',
  },
  ageRange: {
    cs: 'Věkové rozmezí',
    en: 'Age Range',
  },
  ageGroups: {
    infant: {
      cs: 'Kojenec',
      en: 'Infant',
    },
    toddler: {
      cs: 'Batole',
      en: 'Toddler',
    },
    earlyChildhood: {
      cs: 'Rané dětství',
      en: 'Early Childhood',
    },
    lowerElementary: {
      cs: 'Nižší elementární',
      en: 'Lower Elementary',
    },
    upperElementary: {
      cs: 'Vyšší elementární',
      en: 'Upper Elementary',
    },
    middleSchool: {
      cs: 'Střední škola',
      en: 'Middle School',
    },
  },
  minAge: {
    cs: 'Minimální věk',
    en: 'Minimum Age',
  },
  maxAge: {
    cs: 'Maximální věk',
    en: 'Maximum Age',
  },
  years: {
    cs: 'let',
    en: 'years',
  },
  manageTeachersTitle: {
    cs: 'Správa učitelů třídy',
    en: 'Manage Class Teachers',
  },
};
