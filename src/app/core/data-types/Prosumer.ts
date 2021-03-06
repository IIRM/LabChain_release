/**
 * A Prosumer is the actor controlling the respective grid edge assets and perform market operation.
 * While they are the primary subject of the research, this data structure is used more for linking other resources to the research subjects
 *
 * @param id The numerical identification of the Prosumer
 * @param name A string with a more human readable identifier for the Prosumer
 */
import {MarketParticipant} from "./OffmarketTrade";

export class Prosumer{
  /** The numerical identification of the Prosumer */
  id: number;
  /** A string with a more human readable identifier for the Prosumer */
  name?: string;

  constructor(
    id,
    name?
  ) {
    this.id = id;
    if (name !== undefined) {
      this.name = name;
    }
  }
}
