import { DigitalChannel } from "./DigitalChannel";

export class DMRChannel extends DigitalChannel {
  timeslot: 1 | 2 | null;
  colorCode: number;

  static parse(mappedRow: any): DMRChannel {
    let dmrChannel = new DMRChannel();

    dmrChannel.timeslot = null;
    if (mappedRow.timeslot) {
      let timeslot = parseInt(mappedRow.timeslot);
      if (timeslot == 1 || timeslot == 2) {
        dmrChannel.timeslot = timeslot;
      } else {
        throw new Error("Invalid timeslot on DMR channel");
      }
    }

    let colorCode = parseInt(mappedRow.colorCode);
    if (colorCode < 0 || colorCode > 15)
      throw new Error("Invalid color code on DMR channel");
    dmrChannel.colorCode = colorCode;

    return super.parse(dmrChannel, mappedRow) as DMRChannel;
  }
}
