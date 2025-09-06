import { DPL, FMBandwidth, FMChannel } from "./structures/FMChannel";
import { DMRChannel } from "./structures/DMRChannel";
import { Contact, ContactType } from "./structures/Contact";
import { Channel } from "diagnostics_channel";

const CHANNEL_HEADER =
  "Channel Number,Channel Name,Channel Type,Rx Frequency,Tx Frequency,Bandwidth (kHz),Colour Code,Timeslot,Contact,TG List,DMR ID,TS1_TA_Tx,TS2_TA_Tx ID,RX Tone,TX Tone,Squelch,Power,Rx Only,Zone Skip,All Skip,TOT,VOX,No Beep,No Eco,APRS,Latitude,Longitude";
const CONTACT_HEADER = "Contact Name,ID,ID Type,TS Override";

function analogueTemplate(
  position,
  name14,
  rxFreq,
  txFreq,
  bandwidth: "25" | "12.5",
  rxSquelch = "None",
  txSquelch = "None",
  rxOnly: "Yes" | "No" = "No"
) {
  return `${position},${name14},Analogue,	${rxFreq},	${txFreq},${bandwidth},,,,,,,,${rxSquelch},${txSquelch},Disabled,Master,${rxOnly},No,No,0,Off,No,No,None,0.128,0.0336,No`;
}

function digitalTemplate(
  position,
  name14,
  rxFreq,
  txFreq,
  colorCode,
  timeslot = "None",
  contactName = "None",
  contactListName = "None",
  unitId = "None",
  rxOnly: "Yes" | "No" = "No"
) {
  return `${position},${name14},Digital,	${rxFreq},	${txFreq},,${colorCode},${timeslot},${contactName},${contactListName},${unitId},Text,Text,,,,Master,${rxOnly},No,No,0,Off,No,No,None,0.128,0.0336,No`;
}

function contactTemplate(name, id, type: "Private" | "Group") {
  return `${name},${id},${type},Disabled`;
}

function digitalChannel(channel: DMRChannel, position: number): string {
  let txFreq = channel.txFreq;
  let rxOnly = false;
  if (channel.txFreq === null) {
    txFreq = channel.txFreq;
    rxOnly = true;
  }

  let timeslot = "None";
  if (channel.timeslot) {
    timeslot = channel.timeslot.toString();
  }

  let contactName = "None";
  if (channel.contact?.name) {
    contactName = channel.contact.name;
  }

  let unitId = "None";
  if (channel.unitId) {
    timeslot = channel.unitId.toString();
  }

  return digitalTemplate(
    position,
    channel.names[14],
    channel.rxFreq,
    channel.txFreq,
    channel.colorCode,
    timeslot,
    contactName,
    channel.contactList ?? "None",
    unitId,
    rxOnly ? "Yes" : "No"
  );
}

function analogChannel(channel: FMChannel, position: number): string {
  let txFreq = channel.txFreq;
  let rxOnly = false;
  if (channel.txFreq === null) {
    txFreq = channel.txFreq;
    rxOnly = true;
  }

  let bandwidth = "25";
  // Shortcut since this radio only supports 25, and 12.5 kHz
  if (channel.bandwidth != FMBandwidth["25 kHz"]) {
    bandwidth = "12.5";
  }

  let rxSquelch = "None";
  if (channel.rxSquelch instanceof DPL) {
    rxSquelch = "D";
    rxSquelch += channel.rxSquelch.code.toString().padStart(3, "0");
    rxSquelch += channel.rxSquelch.inverse ? "I" : "N";
  }

  let txSquelch = "None";
  if (channel.txSquelch instanceof DPL) {
    txSquelch = "D";
    txSquelch += channel.txSquelch.code.toString().padStart(3, "0");
    txSquelch += channel.txSquelch.inverse ? "I" : "N";
  }

  return digitalTemplate(
    position,
    channel.names[14],
    channel.rxFreq,
    channel.txFreq,
    bandwidth,
    rxSquelch,
    txSquelch,
    rxOnly ? "Yes" : "No"
  );
}

function run(contacts: Set<Contact>, channels: Set<Channel>) {
  const contactList = [CONTACT_HEADER];
  const channelList = [CHANNEL_HEADER];

  for (let contact of contacts) {
    let contactType: "Private" | "Group" = "Group";
    if (contact.type == ContactType.PRIVATE) {
      contactType = "Private";
    }
    contactList.push(contactTemplate(contact.name, contact.id, contactType));
  }

  let position = 0;

  for (let channel of channels) {
    // Frequency range for RT3S
    if (
      (channel instanceof DMRChannel || channel instanceof FMChannel) &&
      ((channel.rxFreq > 136 && channel.rxFreq < 174) ||
        (channel.rxFreq > 220 && channel.rxFreq < 225) ||
        (channel.rxFreq > 400 && channel.rxFreq < 470))
    ) {
      let channelPos = ++position;
      if (channel instanceof DMRChannel) {
        channelList.push(digitalChannel(channel, channelPos));
      } else if (channel instanceof FMChannel) {
        channelList.push(analogChannel(channel, channelPos));
      }
    }
  }

  contactList.join("\n");
  channelList.join("\n");
}
