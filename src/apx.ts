import { Contact, contacts } from "./structures/Contact";
import { DPL, FMBandwidth, FMChannel, FMSquelch } from "./structures/FMChannel";
import { P25Channel } from "./structures/P25Channel";
import * as fs from "fs";
import { read } from "./parseList";
import { channels, Channel } from "./structures/Channel";

const USE_TTS = true;
const USE_MPL = true;

const Bandwidths = new Map([
  [FMBandwidth["12.5 kHz"], "2.5 kHz / 12.5 kHz"],
  [FMBandwidth["20 kHz"], "4 kHz / 20 kHz"],
  [FMBandwidth["25 kHz"], "5 kHz / 25 kHz"],
]);

function getBandwidth(channel: FMChannel | P25Channel) {
  if (channel instanceof FMChannel) {
    return Bandwidths.get(channel.bandwidth) ?? "2.5 kHz / 12.5 kHz";
  }
  return "2.5 kHz / 12.5 kHz";
}

const PLCodes = new Map([
  [67.0, "XZ"],
  [69.3, "WZ"],
  [71.9, "XA"],
  [74.4, "WA"],
  [77.0, "XB"],
  [79.7, "WB"],
  [82.5, "YZ"],
  [85.4, "YA"],
  [88.5, "YB"],
  [91.5, "ZZ"],
  [94.8, "ZA"],
  [97.4, "ZB"],
  [100.0, "1Z"],
  [103.5, "1A"],
  [107.2, "1B"],
  [110.9, "2Z"],
  [114.8, "2A"],
  [118.8, "2B"],
  [123.0, "3Z"],
  [127.3, "3A"],
  [131.8, "3B"],
  [136.5, "4Z"],
  [141.3, "4A"],
  [146.2, "4B"],
  [151.4, "5Z"],
  [156.7, "5A"],
  [162.2, "5B"],
  [167.9, "6Z"],
  [173.8, "6A"],
  [179.9, "6B"],
  [186.2, "7Z"],
  [192.8, "7A"],
  [203.5, "M1"],
  [206.5, "8Z"],
  [210.7, "M2"],
  [218.1, "M3"],
  [225.7, "M4"],
  [229.1, "9Z"],
  [233.6, "M5"],
  [241.8, "M6"],
  [250.3, "M7"],
  [254.1, "0Z"],
  [105.4, "105.4"],
  [109.1, "109.1"],
  [129.6, "129.6"],
  [134.2, "134.2"],
  [138.9, "138.9"],
  [143.8, "143.8"],
  [148.8, "148.8"],
  [150.0, "150.0"],
  [159.5, "159.5"],
  [159.8, "159.8"],
  [165.1, "165.1"],
  [165.5, "165.5"],
  [170.9, "170.9"],
  [171.3, "171.3"],
  [176.9, "176.9"],
  [177.3, "177.3"],
  [183.1, "183.1"],
  [183.5, "183.5"],
  [189.5, "189.5"],
  [189.9, "189.9"],
  [196.6, "196.6"],
  [198.2, "198.2"],
  [199.5, "199.5"],
  [213.8, "213.8"],
  [221.3, "221.3"],
  [237.1, "237.1"],
  [245.5, "245.5"],
]);

function getSquelch(channel: FMChannel, tx, direct) {
  let squelch: FMSquelch;
  if (tx) {
    squelch = channel.txSquelch;
  } else {
    squelch = channel.rxSquelch;
  }

  const arr = [];
  if (squelch instanceof DPL) {
    arr.push(
      "DPL", // Squelch Type
      "67.0", // PL Frequency
      "XZ", // PL Code
      squelch.code, // DPL Code
      squelch.inverse ? "TRUE" : "FALSE" // DPL Invert
    );
  } else if (typeof squelch == "number") {
    arr.push(
      "PL", // Squelch Type
      squelch.toFixed(1), // PL Frequency
      PLCodes.get(squelch) || "XZ", // PL Code
      "031", // DPL Code
      "FALSE" // DPL Invert
    );
  } else {
    arr.push(
      tx || direct ? "Disabled" : "CSQ", // Squelch Type
      "67.0", // PL Frequency
      "XZ", // PL Code
      "031", // DPL Code
      "FALSE" // DPL Invert
    );
  }
  return arr;
}

function p25PersChannel(channel: P25Channel) {
  return [
    parseInt(channel.rxNAC, 16), // RX Network ID
    parseInt(channel.txNAC, 16), // TX Network ID
    parseInt(channel.rxNAC, 16), // Direct Network ID
    channel?.contact?.name ?? "Talkgroup 1", // Astro Talkgroup ID
    ...(USE_MPL
      ? [
          "FALSE", // User Selectable PL
          "Disabled", // User Selectable PL [MPL]
        ]
      : []),
    ..."CSQ	67	XZ	23	FALSE	Disabled	67	XZ	23	FALSE	Disabled	67	XZ	23	FALSE".split("\t"),
  ];
}

function fmPersChannel(channel: FMChannel) {
  return [
    "659", // RX Network ID
    "659", // TX Network ID
    "659", // Direct Network ID
    "Talkgroup 1", // Astro Talkgroup ID
    ...(USE_MPL
      ? [
          "FALSE", // User Selectable PL
          "Disabled", // User Selectable PL [MPL]
        ]
      : []),
    ...getSquelch(channel, false, false),
    ...getSquelch(channel, true, false),
    ...getSquelch(channel, false, true),
  ];
}

function persChannel(channel: FMChannel | P25Channel) {
  const persChannel = [
    channel.names[14], // Name
    channel.rxFreq, // RX Frequency
    channel.txFreq ?? channel.rxFreq, // TX Frequency
    "TRUE", // Direct/Talkaround
    channel.rxFreq, // Direct Frequency
    getBandwidth(channel), // Tx Deviation / Channel Spacing
  ];

  if (channel instanceof P25Channel) {
    persChannel.push(...p25PersChannel(channel));
  }

  if (channel instanceof FMChannel) {
    persChannel.push(...fmPersChannel(channel));
  }

  return persChannel.join("\t");
}

function zoneChannel(channel: FMChannel | P25Channel, personality: string) {
  return [
    "", // Position
    channel.names[14], // Channel Name
    channel.names[8], // Top Display Channel name
    "Cnv", // Channel Type
    personality, // Personality
    "", // Trunking Talkgroup
    channel.names[14], // Conventional Frequency Option
    "<Last Selected>", // Radio Profile Selection
    USE_TTS ? "<TTS>" : "<None>", // Channel Announcement
    channel.names.tts, // Voice Control Name / TTS Announcement
    /*
    "White", // Channel Color Backlight
    "TRUE", // Active Channel
    "<Disabled>", // Fallback Zone
    "<Disabled>", // Fallback Channel
    "Allow", // Wifi Enabled
    */
  ].join("	");
}

function getPersonality(channel: FMChannel | P25Channel) {
  // Codeplug special personality override
  if (channel?.extra?.personality) {
    return channel?.extra?.personality;
  }

  if (channel.group.length > 13) {
    console.log("Zone name too long: " + channel.group);
  }

  // There is no way to make a zone with both TX and RX channels, so we'll separate RX only channels
  // $ refers to scan
  if (channel.txFreq === null) {
    return "$" + channel.group;
  }

  return channel.group;
}

const personalities: Map<string, Set<FMChannel | P25Channel>> = new Map();

function run(_contacts: Set<Contact>, channels: Set<Channel>) {
  const zoneChannels = [];
  const persChannels = [];

  // Sort into personalities
  for (let channel of channels) {
    if (
      channel.rxFreq > 380 &&
      channel.rxFreq < 470 &&
      (channel instanceof FMChannel || channel instanceof P25Channel)
    ) {
      const personality = getPersonality(channel);
      if (personalities.has(personality)) {
        personalities.get(personality).add(channel);
      } else {
        personalities.set(personality, new Set([channel]));
      }
    }
  }

  for (let personalityEntry of personalities.entries()) {
    let personality = personalityEntry[0];
    let channels = personalityEntry[1];
    persChannels.push(personality);
    zoneChannels.push(personality);
    for (let channel of channels) {
      persChannels.push(persChannel(channel));
      zoneChannels.push(zoneChannel(channel, personality));
    }
    persChannels.push("\r\n");
    zoneChannels.push("\r\n");
  }

  fs.writeFileSync("apx-channels-zones.tsv", zoneChannels.join("\r\n"));
  fs.writeFileSync("apx-channels-personalities.tsv", persChannels.join("\r\n"));
}

read();
run(contacts, channels);
