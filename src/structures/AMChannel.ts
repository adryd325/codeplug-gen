import { Channel } from "./Channel";

export class AMChannel extends Channel {
  static parse(mappedRow: any): AMChannel {
    const amChannel = new AMChannel();
    return super.parse(amChannel, mappedRow) as AMChannel;
  }
}
