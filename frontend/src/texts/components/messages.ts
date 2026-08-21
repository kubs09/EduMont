import { common } from './common';

export const messages = {
  errors: {
    fetchFailed: {
      cs: 'Nepodařilo se načíst zprávy',
      en: 'Failed to fetch messages',
    },
    fetchUsersFailed: {
      cs: 'Nepodařilo se načíst seznam uživatelů',
      en: 'Failed to fetch users',
    },
    fetchMessageFailed: {
      cs: 'Nepodařilo se načíst zprávu',
      en: 'Failed to fetch message',
    },
    deleteFailed: {
      cs: 'Nepodařilo se smazat zprávu',
      en: 'Failed to delete message',
    },
    sendFailed: {
      cs: 'Nepodařilo se odeslat zprávu',
      en: 'Failed to send message',
    },
  },
  success: {
    sent: {
      cs: 'Zpráva byla úspěšně odeslána',
      en: 'Message sent successfully',
    },
    deleted: {
      cs: 'Zpráva byla úspěšně smazána',
      en: 'Message deleted successfully',
    },
  },
  validation: {
    recipientsRequired: {
      cs: 'Je vyžadován alespoň jeden příjemce',
      en: 'At least one recipient is required',
    },
    subject: common.templates.validation.required({ cs: 'Předmět', en: 'Subject' }, 'masc'),
    subjectMaxLength: common.templates.validation.maxLength({ cs: 'Předmět', en: 'Subject' }, 255),
    content: common.templates.validation.required(
      { cs: 'Obsah zprávy', en: 'Message content' },
      'masc'
    ),
    contentMaxLength: common.templates.validation.maxLength(
      { cs: 'Obsah zprávy', en: 'Message content' },
      5000
    ),
  },
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
  content: {
    cs: 'Obsah zprávy',
    en: 'Message Content',
  },
  recipients: {
    cs: 'Příjemci',
    en: 'Recipients',
  },
  send: {
    cs: 'Odeslat',
    en: 'Send',
  },
  noMessages: {
    cs: 'Žádné zprávy',
    en: 'No messages',
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
  allUsers: {
    cs: 'Všichni uživatelé',
    en: 'All Users',
  },
  allParentsInClass: {
    cs: 'Všichni rodiče v mých třídách',
    en: 'All Parents in My Classes',
  },
};
