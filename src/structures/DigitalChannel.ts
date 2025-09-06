import { Channel } from "./Channel";
import { Contact, findContact } from "./Contact";

export class DigitalChannel extends Channel {
  contact: Contact | null;
  contactList: string | null;
  unitId: number | null;
  key: string | null;

  static parse(channel: DigitalChannel, mappedRow: any): DigitalChannel {
    if (mappedRow.contact) {
      channel.contact = findContact(mappedRow.contactList);
    } else {
      channel.contact = null;
    }

    channel.contactList = mappedRow.contactList ?? null;

    if (mappedRow.unitId) {
      channel.unitId = parseInt(mappedRow.unitId);
    } else {
      channel.unitId = null;
    }

    channel.key = mappedRow.key;

    return super.parse(channel, mappedRow) as DigitalChannel;
  }
}
