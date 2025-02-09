export const texts = {
  auth: {
    signIn: {
      title: {
        cs: 'Přihlášení',
        en: 'Sign In',
      },
      emailPlaceholder: {
        cs: 'Emailová adresa',
        en: 'Email Address',
      },
      passwordPlaceholder: {
        cs: 'Heslo',
        en: 'Password',
      },
      submitButton: {
        cs: 'Přihlásit se',
        en: 'Sign In',
      },
      serverError: {
        cs: 'Nepodařilo se připojit k serveru. Zkuste to prosím později.',
        en: 'Unable to connect to the server. Please try again later.',
      },
      emailRequired: {
        cs: 'Emailová adresa je povinná',
        en: 'Email address is required',
      },
      passwordRequired: {
        cs: 'Heslo je povinné',
        en: 'Password is required',
      },
      invalidEmail: {
        cs: 'Prosím zadejte platnou emailovou adresu',
        en: 'Please enter a valid email address',
      },
      invalidCredentials: {
        cs: 'Nesprávný email nebo heslo',
        en: 'Invalid email or password',
      },
      forgotPassword: {
        cs: 'Zapomněli jste heslo?',
        en: 'Forgot your password?',
      },
    },
    signup: {
      cs: 'Registrace',
      en: 'Sign Up',
    },
    signUp: {
      validation: {
        firstNameRequired: {
          cs: 'Jméno musí mít alespoň 2 znaky',
          en: 'First name must be at least 2 characters',
        },
        lastNameRequired: {
          cs: 'Příjmení musí mít alespoň 2 znaky',
          en: 'Last name must be at least 2 characters',
        },
        invalidEmail: {
          cs: 'Zadejte platnou emailovou adresu',
          en: 'Invalid email address',
        },
        passwordLength: {
          cs: 'Heslo musí mít alespoň 8 znaků',
          en: 'Password must be at least 8 characters',
        },
        passwordsMatch: {
          cs: 'Hesla se neshodují',
          en: "Passwords don't match",
        },
      },
    },
    login: {
      cs: 'Přihlásit',
      en: 'Login',
    },
    logout: {
      cs: 'Odhlásit',
      en: 'Logout',
    },
    forgotPassword: {
      title: {
        cs: 'Zapomenuté heslo',
        en: 'Forgot Password',
      },
      description: {
        cs: 'Zadejte svůj email a my vám pošleme odkaz pro obnovení hesla.',
        en: 'Enter your email and we will send you a password reset link.',
      },
      emailPlaceholder: {
        cs: 'Emailová adresa',
        en: 'Email Address',
      },
      submitButton: {
        cs: 'Odeslat odkaz pro obnovení',
        en: 'Send Reset Link',
      },
      loginLink: {
        cs: 'Zpět na přihlášení',
        en: 'Back to Login',
      },
      success: {
        title: {
          cs: 'Email odeslán',
          en: 'Email Sent',
        },
        message: {
          cs: 'Pokud účet s tímto emailem existuje, poslali jsme vám odkaz pro obnovení hesla.',
          en: 'If an account exists with this email, we have sent you a password reset link.',
        },
        cs: 'Email byl odeslán',
        en: 'Email has been sent',
      },
      error: {
        title: {
          cs: 'Chyba',
          en: 'Error',
        },
        message: {
          cs: 'Nepodařilo se odeslat email pro obnovení hesla. Zkuste to prosím později.',
          en: 'Failed to send password reset email. Please try again later.',
        },
        cs: 'Nepodařilo se odeslat email',
        en: 'Failed to send email',
      },
      checkEmail: {
        cs: 'Pokud je email registrován, poslali jsme vám instrukce pro obnovení hesla.',
        en: 'If the email is registered, we have sent you password reset instructions.',
      },
      validation: {
        emailRequired: {
          cs: 'Email je povinný',
          en: 'Email is required',
        },
        invalidEmail: {
          cs: 'Zadejte platnou emailovou adresu',
          en: 'Please enter a valid email address',
        },
      },
    },
    resetPassword: {
      title: {
        cs: 'Obnovení hesla',
        en: 'Reset Password',
      },
      passwordPlaceholder: {
        cs: 'Nové heslo',
        en: 'New Password',
      },
      confirmPasswordPlaceholder: {
        cs: 'Potvrďte nové heslo',
        en: 'Confirm New Password',
      },
      submitButton: {
        cs: 'Změnit heslo',
        en: 'Reset Password',
      },
      success: {
        cs: 'Heslo bylo úspěšně změněno',
        en: 'Password has been reset successfully',
      },
      error: {
        cs: 'Nepodařilo se změnit heslo',
        en: 'Failed to reset password',
      },
      invalidToken: {
        cs: 'Neplatný nebo expirovaný odkaz pro obnovení hesla',
        en: 'Invalid or expired password reset link',
      },
    },
  },
  unauthorized: {
    title: {
      cs: 'Přístup zamítnut',
      en: 'Access Denied',
    },
    subtitle: {
      cs: '401',
      en: '401',
    },
    message: {
      cs: 'Pro přístup k těmto stránkám se prosím přihlašte.',
      en: 'Please sign in to access these pages.',
    },
    loginButton: {
      cs: 'Přihlásit se',
      en: 'Sign In',
    },
  },
  dashboard: {
    title: {
      cs: 'Naši školáci',
      en: 'Our Students',
    },
    logout: {
      cs: 'Odhlásit se',
      en: 'Logout',
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
    age: {
      cs: 'Věk',
      en: 'Age',
    },
    parent: {
      cs: 'Rodič',
      en: 'Parent',
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
  userDashboard: {
    title: {
      cs: 'Seznam uživatelů',
      en: 'User List',
    },
    menuItem: {
      cs: 'Správa uživatelů',
      en: 'User Management',
    },
    errorTitle: {
      cs: 'Chyba',
      en: 'Error',
    },
    fetchError: {
      cs: 'Nepodařilo se načíst seznam uživatelů. Zkuste to prosím později.',
      en: 'Failed to load user list. Please try again later.',
    },
    addUser: {
      cs: 'Přidat uživatele',
      en: 'Add User',
    },
    addUserButton: {
      cs: 'Nový uživatel',
      en: 'New User',
    },
    emailLabel: {
      cs: 'Email',
      en: 'Email',
    },
    roleLabel: {
      cs: 'Role',
      en: 'Role',
    },
    cancel: {
      cs: 'Zrušit',
      en: 'Cancel',
    },
    submit: {
      cs: 'Vytvořit',
      en: 'Create',
    },
    success: {
      cs: 'Uživatel byl úspěšně vytvořen',
      en: 'User created successfully',
    },
    userExists: {
      cs: 'Uživatel s tímto emailem již existuje',
      en: 'User with this email already exists',
    },
    invitationExists: {
      cs: 'Pozvánka pro tento email již byla odeslána',
      en: 'An invitation has already been sent to this email',
    },
  },
  userTable: {
    name: {
      cs: 'Jméno',
      en: 'Name',
    },
    email: {
      cs: 'Email',
      en: 'Email',
    },
    role: {
      cs: 'Role',
      en: 'Role',
    },
    roles: {
      admin: {
        cs: 'Administrátor',
        en: 'Administrator',
      },
      teacher: {
        cs: 'Učitel',
        en: 'Teacher',
      },
      parent: {
        cs: 'Rodič',
        en: 'Parent',
      },
    },
  },
  home: {
    hero: {
      title: {
        cs: 'EduMont - Montessori Vzdělávací Platforma',
        en: 'EduMont - Montessori Education Platform',
      },
      subtitle: {
        cs: 'Propojujeme rodiče, učitele a děti v duchu Montessori vzdělávání',
        en: 'Connecting parents, teachers, and children in the spirit of Montessori education',
      },
      getStarted: {
        cs: 'Připojit se',
        en: 'Join Us',
      },
    },
    features: {
      qualityEducation: {
        title: {
          cs: 'Montessori Přístup',
          en: 'Montessori Approach',
        },
        description: {
          cs: 'Respektujeme individuální tempo a potřeby každého dítěte',
          en: 'Respecting individual pace and needs of each child',
        },
      },
      expertTeachers: {
        title: {
          cs: 'Aktivní Komunikace',
          en: 'Active Communication',
        },
        description: {
          cs: 'Pravidelné sdílení pokroku a aktivit vašeho dítěte',
          en: "Regular updates on your child's progress and activities",
        },
      },
      interactiveLearning: {
        title: {
          cs: 'Připravené Prostředí',
          en: 'Prepared Environment',
        },
        description: {
          cs: 'Sledujte rozvoj dítěte v pečlivě připraveném Montessori prostředí',
          en: "Track your child's development in carefully prepared Montessori environment",
        },
      },
    },
    cta: {
      title: {
        cs: 'Připraveni začít se učit?',
        en: 'Ready to Start Learning?',
      },
      subtitle: {
        cs: 'Připojte se k naší vzdělávací komunitě ještě dnes',
        en: 'Join our community of learners today',
      },
      button: {
        cs: 'Registrujte se nyní',
        en: 'Sign Up Now',
      },
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
  profile: {
    title: {
      cs: 'Můj profil',
      en: 'My Profile',
    },
    menuItem: {
      cs: 'Můj profil',
      en: 'My Profile',
    },
    email: {
      cs: 'Emailová adresa',
      en: 'Email Address',
    },
    firstName: {
      cs: 'Jméno',
      en: 'First Name',
    },
    lastName: {
      cs: 'Příjmení',
      en: 'Last Name',
    },
    role: {
      cs: 'Role',
      en: 'Role',
    },
    phone: {
      cs: 'Telefon',
      en: 'Phone',
    },
    edit: {
      cs: 'Upravit profil',
      en: 'Edit Profile',
    },
    save: {
      cs: 'Uložit změny',
      en: 'Save Changes',
    },
    cancel: {
      cs: 'Zrušit',
      en: 'Cancel',
    },
    success: {
      cs: 'Profil byl úspěšně aktualizován',
      en: 'Profile updated successfully',
    },
    error: {
      cs: 'Nepodařilo se aktualizovat profil',
      en: 'Failed to update profile',
    },
    changePassword: {
      cs: 'Změnit heslo',
      en: 'Change Password',
    },
    currentPassword: {
      cs: 'Současné heslo',
      en: 'Current Password',
    },
    newPassword: {
      cs: 'Nové heslo',
      en: 'New Password',
    },
    confirmNewPassword: {
      cs: 'Potvrďte nové heslo',
      en: 'Confirm New Password',
    },
    passwordChanged: {
      cs: 'Heslo bylo úspěšně změněno',
      en: 'Password changed successfully',
    },
    passwordError: {
      cs: 'Nepodařilo se změnit heslo',
      en: 'Failed to change password',
    },
    currentPasswordRequired: {
      cs: 'Zadejte současné heslo',
      en: 'Current password is required',
    },
    newPasswordRequired: {
      cs: 'Zadejte nové heslo',
      en: 'New password is required',
    },
    passwordsDoNotMatch: {
      cs: 'Hesla se neshodují',
      en: 'Passwords do not match',
    },
    incorrectCurrentPassword: {
      cs: 'Současné heslo není správné',
      en: 'Current password is incorrect',
    },
    validation: {
      currentPasswordRequired: {
        cs: 'Současné heslo je povinné',
        en: 'Current password is required',
      },
      newPasswordRequired: {
        cs: 'Nové heslo je povinné',
        en: 'New password is required',
      },
      newPasswordLength: {
        cs: 'Nové heslo musí mít alespoň 8 znaků',
        en: 'New password must be at least 8 characters',
      },
      confirmPasswordRequired: {
        cs: 'Potvrďte prosím nové heslo',
        en: 'Please confirm your new password',
      },
      passwordsDoNotMatch: {
        cs: 'Hesla se neshodují',
        en: "Passwords don't match",
      },
      firstNameRequired: {
        cs: 'Jméno je povinné',
        en: 'First name is required',
      },
      firstNameLength: {
        cs: 'Jméno musí mít alespoň 2 znaky',
        en: 'First name must be at least 2 characters',
      },
      lastNameRequired: {
        cs: 'Příjmení je povinné',
        en: 'Last name is required',
      },
      lastNameLength: {
        cs: 'Příjmení musí mít alespoň 2 znaky',
        en: 'Last name must be at least 2 characters',
      },
      emailRequired: {
        cs: 'Email je povinný',
        en: 'Email is required',
      },
      emailInvalid: {
        cs: 'Zadejte platnou emailovou adresu',
        en: 'Please enter a valid email address',
      },
      passwordUppercase: {
        cs: 'Heslo musí obsahovat alespoň jedno velké písmeno',
        en: 'Password must contain at least one uppercase letter',
      },
      passwordNumber: {
        cs: 'Heslo musí obsahovat alespoň jedno číslo',
        en: 'Password must contain at least one number',
      },
      passwordMatch: {
        cs: 'Hesla se musí shodovat',
        en: 'Passwords must match',
      },
      invalidPhone: {
        cs: 'Zadejte platné telefonní číslo',
        en: 'Please enter a valid phone number',
      },
    },
    children: {
      title: {
        cs: 'Moje děti',
        en: 'My Children',
      },
      noChildren: {
        cs: 'Zatím nemáte přiřazené žádné děti',
        en: 'No children assigned yet',
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
        success: {
          cs: 'Dítě bylo úspěšně přidáno',
          en: 'Child added successfully',
        },
        error: {
          cs: 'Chyba při přidávání dítěte',
          en: 'Error Adding Child',
        },
      },
      dateOfBirth: {
        cs: 'Datum narození',
        en: 'Date of Birth',
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
      deleteSuccess: {
        cs: 'Dítě bylo úspěšně smazáno',
        en: 'Child deleted successfully',
      },
      deleteError: {
        cs: 'Nepodařilo se smazat dítě',
        en: 'Failed to delete child',
      },
      validation: {
        firstNameLength: {
          cs: 'Jméno musí mít alespoň 2 znaky',
          en: 'First name must be at least 2 characters',
        },
        firstNameMaxLength: {
          cs: 'Jméno nesmí být delší než 100 znaků',
          en: 'First name must not exceed 100 characters',
        },
        surnameLength: {
          cs: 'Příjmení musí mít alespoň 2 znaky',
          en: 'Surname must be at least 2 characters',
        },
        surnameMaxLength: {
          cs: 'Příjmení nesmí být delší než 100 znaků',
          en: 'Surname must not exceed 100 characters',
        },
        dateFormat: {
          cs: 'Neplatný formát data. Použijte RRRR-MM-DD',
          en: 'Invalid date format. Use YYYY-MM-DD',
        },
        ageRange: {
          cs: 'Věk dítěte musí být mezi 0 a 18 lety',
          en: 'Child age must be between 0 and 18 years',
        },
        contactRequired: {
          cs: 'Kontakt musí mít alespoň 5 znaků',
          en: 'Contact must be at least 5 characters',
        },
        contactMaxLength: {
          cs: 'Kontakt nesmí být delší než 50 znaků',
          en: 'Contact must not exceed 50 characters',
        },
        notesMaxLength: {
          cs: 'Poznámky nesmí být delší než 1000 znaků',
          en: 'Notes must not exceed 1000 characters',
        },
      },
      noSuitableClass: {
        title: {
          cs: 'Nelze přiřadit do třídy',
          en: 'Cannot Assign to Class',
        },
        description: {
          cs: 'Pro tento věk není k dispozici žádná třída',
          en: 'No class available for this age',
        },
      },
    },
    notifications: {
      title: {
        cs: 'Nastavení upozornění',
        en: 'Notification Settings',
      },
      messages: {
        cs: 'Emailová upozornění na nové zprávy',
        en: 'Email notifications for new messages',
      },
      updateSuccess: {
        cs: 'Nastavení upozornění bylo aktualizováno',
        en: 'Notification settings updated successfully',
      },
      updateError: {
        cs: 'Nepodařilo se aktualizovat nastavení upozornění',
        en: 'Failed to update notification settings',
      },
    },
  },
  invitation: {
    emailSubject: {
      cs: 'Pozvánka do systému EduMont',
      en: 'Invitation to EduMont',
    },
    emailTitle: {
      cs: 'Vítejte v EduMont',
      en: 'Welcome to EduMont',
    },
    emailMessage: {
      cs: 'Byli jste pozváni do systému EduMont jako',
      en: 'You have been invited to join EduMont as a',
    },
    emailAction: {
      cs: 'Pro dokončení registrace klikněte na tento odkaz:',
      en: 'Please click the link below to complete your registration:',
    },
    emailExpiry: {
      cs: 'Tento odkaz vyprší za 48 hodin.',
      en: 'This link will expire in 48 hours.',
    },
    invalid: {
      cs: 'Neplatná nebo expirovaná pozvánka',
      en: 'Invalid or expired invitation',
    },
  },
  inviteSignup: {
    title: {
      cs: 'Dokončení registrace',
      en: 'Complete Registration',
    },
    success: {
      title: {
        cs: 'Registrace dokončena',
        en: 'Registration Complete',
      },
      description: {
        cs: 'Váš účet byl úspěšně vytvořen. Nyní se můžete přihlásit.',
        en: 'Your account has been created successfully. You can now log in.',
      },
    },
    error: {
      title: {
        cs: 'Chyba při registraci',
        en: 'Registration Error',
      },
      description: {
        cs: 'Nepodařilo se dokončit registraci. Zkuste to prosím později.',
        en: 'Failed to complete registration. Please try again later.',
      },
    },
    form: {
      firstName: {
        cs: 'Jméno',
        en: 'First Name',
      },
      lastName: {
        cs: 'Příjmení',
        en: 'Last Name',
      },
      password: {
        cs: 'Heslo',
        en: 'Password',
      },
      submit: {
        cs: 'Dokončit registraci',
        en: 'Complete Registration',
      },
    },
  },
  classes: {
    action: {
      cs: 'Akce',
      en: 'Action',
    },
    menuItem: {
      cs: 'Třídy',
      en: 'Classes',
    },
    title: {
      cs: 'Seznam tříd',
      en: 'Class List',
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
    children: {
      cs: 'Děti',
      en: 'Children',
    },
    manageClass: {
      cs: 'Správa třídy',
      en: 'Manage Class',
    },
    saveChanges: {
      cs: 'Uložit změny',
      en: 'Save Changes',
    },
    cancel: {
      cs: 'Zrušit',
      en: 'Cancel',
    },
    selectTeachers: {
      cs: 'Vybrat učitele',
      en: 'Select Teachers',
    },
    selectChildren: {
      cs: 'Vybrat děti',
      en: 'Select Children',
    },
    updateSuccess: {
      cs: 'Třída byla úspěšně aktualizována',
      en: 'Class updated successfully',
    },
    updateError: {
      cs: 'Nepodařilo se aktualizovat třídu',
      en: 'Failed to update class',
    },
    validation: {
      teacherRequired: {
        cs: 'Třída musí mít alespoň jednoho učitele',
        en: 'Class must have at least one teacher',
      },
      childRequired: {
        cs: 'Třída musí mít alespoň jedno dítě',
        en: 'Class must have at least one child',
      },
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
      teachers: {
        cs: 'Učitelé',
        en: 'Teachers',
      },
      students: {
        cs: 'Studenti',
        en: 'Students',
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
    },
    editInfo: {
      cs: 'Upravit informace',
      en: 'Edit Info',
    },
    editClassTitle: {
      cs: 'Upravit informace o třídě',
      en: 'Edit Class Information',
    },
    autoAssign: {
      cs: 'Automaticky přiřadit děti',
      en: 'Auto-assign Children',
    },
    ageRange: {
      cs: 'Věkové rozmezí',
      en: 'Age Range',
    },
    minAge: {
      cs: 'Minimální věk',
      en: 'Minimum Age',
    },
    maxAge: {
      cs: 'Maximální věk',
      en: 'Maximum Age',
    },
    manageTeachersTitle: {
      cs: 'Správa učitelů třídy',
      en: 'Manage Class Teachers',
    },
    confirmation: {
      status: {
        cs: 'Potvrzeno',
        en: 'Confirmed',
      },
      pending: {
        cs: 'Čeká na potvrzení',
        en: 'Pending Confirmation',
      },
      confirm: {
        cs: 'Potvrdit',
        en: 'Confirm',
      },
      success: {
        cs: 'Dítě bylo úspěšně potvrzeno do třídy',
        en: 'Child was successfully confirmed in the class',
      },
      error: {
        cs: 'Nepodařilo se potvrdit dítě do třídy',
        en: 'Failed to confirm child in class',
      },
    },
  },
  messages: {
    title: {
      cs: 'Zprávy',
      en: 'Messages',
    },
    inbox: {
      cs: 'Příchozí',
      en: 'Inbox',
    },
    sent: {
      cs: 'Odeslané',
      en: 'Sent',
    },
    compose: {
      cs: 'Nová zpráva',
      en: 'New Message',
    },
    subject: {
      cs: 'Předmět',
      en: 'Subject',
    },
    from: {
      cs: 'Od',
      en: 'From',
    },
    to: {
      cs: 'Komu',
      en: 'To',
    },
    date: {
      cs: 'Datum',
      en: 'Date',
    },
    content: {
      cs: 'Obsah zprávy',
      en: 'Message Content',
    },
    send: {
      cs: 'Odeslat',
      en: 'Send',
    },
    reply: {
      cs: 'Odpovědět',
      en: 'Reply',
    },
    delete: {
      cs: 'Smazat',
      en: 'Delete',
    },
    noMessages: {
      cs: 'Žádné zprávy',
      en: 'No messages',
    },
    fetchUsersError: {
      cs: 'Nepodařilo se načíst seznam uživatelů',
      en: 'Failed to fetch users',
    },
    noUsersAvailable: {
      cs: 'Žádní uživatelé nejsou k dispozici',
      en: 'No users available',
    },
    selectUser: {
      cs: 'Vyberte příjemce',
      en: 'Select recipient',
    },
    refresh: {
      cs: 'Obnovit',
      en: 'Refresh',
    },
    search: {
      cs: 'Hledat zprávy...',
      en: 'Search messages...',
    },
    sortDate: {
      cs: 'Datum',
      en: 'Date',
    },
    noMessagesFound: {
      cs: 'Žádné zprávy nenalezeny',
      en: 'No messages found',
    },
    notification: {
      subject: {
        cs: 'Nová zpráva od',
        en: 'New message from',
      },
      viewMessage: {
        cs: 'Zobrazit zprávu',
        en: 'View Message',
      },
    },
    roleGroups: {
      admin: {
        cs: 'Administrátoři',
        en: 'Administrators',
      },
      teacher: {
        cs: 'Učitelé',
        en: 'Teachers',
      },
      parent: {
        cs: 'Rodiče',
        en: 'Parents',
      },
    },
    classLabel: {
      cs: 'Třída:',
      en: 'Class:',
    },
  },
  common: {
    actions: {
      cs: 'Akce',
      en: 'Actions',
    },
    delete: {
      cs: 'Smazat',
      en: 'Delete',
    },
    save: {
      cs: 'Uložit',
      en: 'Save',
    },
    cancel: {
      cs: 'Zrušit',
      en: 'Cancel',
    },
  },
};
