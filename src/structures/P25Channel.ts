import { DigitalChannel } from "./DigitalChannel";

export class P25Channel extends DigitalChannel {
  rxNAC: string;
  txNAC: string;

  static parse(mappedRow: any): P25Channel {
    let p25channel = new P25Channel();

    if (mappedRow.rxNAC) {
      p25channel.rxNAC = mappedRow.rxNAC;
    } else {
      p25channel.rxNAC = "293";
    }

    if (mappedRow.txNAC) {
      p25channel.txNAC = mappedRow.txNAC;
    } else {
      p25channel.txNAC = "293";
    }

    return super.parse(p25channel, mappedRow) as P25Channel;
  }
}
