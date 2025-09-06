import { Channel } from "./Channel";

export enum FMBandwidth {
  "25 kHz",
  "20 kHz",
  "12.5 kHz",
}

export class DPL {
  code: number;
  inverse: boolean;

  constructor(code: number, inverse: boolean) {
    this.code = code;
    this.inverse = inverse;
  }

  static parse(str: string) {
    let inverse = false;
    let code;

    if (str.endsWith("R")) {
      inverse = true;
      code = parseInt(str.substring(0, str.length - 1));
    } else {
      code = parseInt(str);
    }

    return new DPL(code, inverse);
  }
}

export type FMSquelch = number | DPL | null;

const fmBwMap = new Map([
  ["FM 12.5 kHz", FMBandwidth["12.5 kHz"]],
  ["FM 20 kHz", FMBandwidth["20 kHz"]],
  ["FM 25 kHz", FMBandwidth["25 kHz"]],
]);

export class FMChannel extends Channel {
  bandwidth: FMBandwidth;
  rxSquelch: FMSquelch;
  txSquelch: FMSquelch;

  static parse(mappedRow: any): FMChannel {
    let fmChannel = new FMChannel();

    const bandwidth = fmBwMap.get(mappedRow.mode);
    // I fucking hate TypeScript.
    if (bandwidth === undefined) {
      throw new Error("Invalid Channel Mode");
    }
    fmChannel.bandwidth = bandwidth;

    if (mappedRow.rxDPL) {
      fmChannel.rxSquelch = DPL.parse(mappedRow.rxDPL);
    } else if (mappedRow.rxTPL) {
      fmChannel.rxSquelch = parseFloat(mappedRow.rxTPL);
    } else {
      fmChannel.rxSquelch = null;
    }

    if (mappedRow.txDPL) {
      fmChannel.txSquelch = DPL.parse(mappedRow.txDPL);
    } else if (mappedRow.rxTPL) {
      fmChannel.txSquelch = parseFloat(mappedRow.txTPL);
    } else {
      fmChannel.txSquelch = null;
    }

    return super.parse(fmChannel, mappedRow) as FMChannel;
  }
}
