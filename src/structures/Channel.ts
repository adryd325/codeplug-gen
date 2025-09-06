export const channels: Set<Channel> = new Set();

export enum Mode {
  FM25K,
  FM20K,
  FM12500,
  P25,
  DMR,
  TETRA,
  AM,
}

export const modeMap = new Map([
  ["FM 12.5 kHz", Mode.FM12500],
  ["FM 20 kHz", Mode.FM20K],
  ["FM 25 kHz", Mode.FM25K],
  ["DMR", Mode.DMR],
  ["P25", Mode.P25],
  ["TETRA", Mode.TETRA],
  ["AM", Mode.AM],
]);

export class Channel {
  name: string;
  names: {
    14: string;
    8: string;
    tts: string;
  };
  group: string;
  rxFreq: number;
  txFreq: number | null;
  extra: any;

  static parse(channel: Channel, mappedRow: any): Channel {
    if (channel.name === null) throw new Error("Channel name cannot be null");
    channel.name = mappedRow.name;

    // names
    channel.names = {
      14: mappedRow.name14 ?? channel.name.slice(0, 14),
      8: mappedRow.name8 ?? channel.name.slice(0, 8),
      tts: mappedRow.nameTts ?? channel.name,
    };

    // rxFreq
    channel.rxFreq = parseFloat(mappedRow.rxFreq);
    if (mappedRow.txFreq) {
      channel.txFreq = parseFloat(mappedRow.txFreq);
    } else {
      channel.txFreq = null;
    }

    channel.group = mappedRow.group;

    if (mappedRow.extra) {
      channel.extra = JSON.parse(mappedRow.extra);
    }

    return channel;
  }
}
