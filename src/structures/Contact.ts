export const contacts: Set<Contact> = new Set();

export enum ContactType {
  PRIVATE,
  GROUP,
}

export class Contact {
  id: number;
  name: string | null;
  special: any;
  type: ContactType;
  names: {
    15: string | null;
    8: string | null;
    tts: string | null;
  };
}

export class ContactList {
  name: string;
  list: Contact[];
}

export class P25Contact extends Contact {
  key: string | null;
}

export function findContact(name: string): Contact | null {
  return [...contacts].find((contact) => contact.name == name) ?? null;
}
