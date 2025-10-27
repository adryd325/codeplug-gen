import { Mode, channels, modeMap } from "./structures/Channel";
import { DMRChannel } from "./structures/DMRChannel";
import { FMChannel } from "./structures/FMChannel";
import { P25Channel } from "./structures/P25Channel";
import { parse as parseCsv } from "csv-parse/sync";
import * as fs from "fs";

let ContactKeyNames = new Map([
  ["zone", "Zone"],
  ["name", "Name"],
  ["name15", "Short Name (15 Chars)"],
  ["name8", "Short Name (8 Chars)"],
  ["nameTts", "TTS"],
  ["type", "Type"],
  ["id", "ID"],
  ["key", "Key"],
]);

let ChannelKeyNames: Map<string, string> = new Map([
  ["group", "Group/Zone"],
  ["band", "Band"],
  ["favourite", "⭐"],
  ["name", "Name"],
  ["name14", "Short Name (14 Chars)"],
  ["name8", "Short Name (8 Chars)"],
  ["nameTts", "TTS"],
  ["location", "Location"],
  ["mode", "Mode"],
  ["rxFreq", "RX Freq MHz"],
  ["txFreq", "TX Freq MHz"],
  ["txOffset", "TX Offset"],
  ["extra", "Codeplug Builder Special"],
  ["rxTPL", "Analog RX TPL"],
  ["txTPL", "Analog TX TPL"],
  ["rxDPL", "Analog RX DPL"],
  ["txDPL", "Analog TX DPL"],
  ["contact", "Talkgroup"],
  ["contactList", "Talkgroup List"],
  ["key", "Key"],
  ["unitId", "Unit ID"],
  ["timeslot", "DMR Timeslot"],
  ["colorCode", "DMR Color Code"],
  ["rxNAC", "P25 RX NAC (HEX)"],
  ["txNAC", "P25 TX NAC (HEX)"],
  ["mcc", "TETRA MCC"],
  ["mnc", "TETRA MNC"],
]);

function transformKeys(csvRow: any, mappings: Map<string, string>): any {
  const normalized = {};
  for (let entry of mappings.entries()) {
    if (csvRow[entry[1]]) {
      normalized[entry[0]] = csvRow[entry[1]];
    } else {
      normalized[entry[0]] = null;
    }
  }
  return normalized;
}

export function parseChannel(csvRow: any) {
  // Parse mode
  const mappedRow = transformKeys(csvRow, ChannelKeyNames);
  const mode = modeMap.get(mappedRow.mode);
  switch (mode) {
    case Mode.FM12500:
    case Mode.FM20K:
    case Mode.FM25K:
      channels.add(FMChannel.parse(mappedRow));
      break;
    case Mode.DMR:
      channels.add(DMRChannel.parse(mappedRow));
      break;
    case Mode.P25:
      channels.add(P25Channel.parse(mappedRow));
      break;
    case Mode.TETRA:
    case Mode.AM:
      console.log("Parser not implemented for mode: " + mode);
      break;
    default:
      console.log(csvRow);
      throw new Error("Invalid Channel Mode: " + mappedRow.mode);
  }
}

export function read() {
  const contactsIn = fs.readFileSync("contacts-in.csv", "utf-8");
  const channelsIn = fs.readFileSync("channels-in.csv", "utf-8");

  const csvContacts = parseCsv(contactsIn, { columns: true });
  const csvChannels = parseCsv(channelsIn, { columns: true });

  // for (let i in csvContacts) {
  //   parseContact(csvContacts[i]);
  // }

  for (let i in csvChannels) {
    parseChannel(csvChannels[i]);
  }
}
