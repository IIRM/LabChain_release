import { P2PMarketDesign } from './P2PMarketDesign';
import {ExperimentDescriptionProsumer} from "./ExperimentDescriptionProsumers";

/**
 * A data type that describes an experiments configuration as a blue print to run concrete instances in
 *
 * @param prosumer The prosumers participating in the experiment
 * @param p2pMarketDesign The market design of the experiment
 * @param description A textual description of the experiment
 */
export interface ExperimentDescription {
  /** The prosumers participating in the experiment */
  prosumers: ExperimentDescriptionProsumer[];
  /** The market design of the experiment */
  p2pMarketDesign: P2PMarketDesign;
  /** The time series of the feed-in-remuneration (in tokens/kWh) */
  feedInTariff: number[];
  /** The time series of the retail electricity price (in tokens/kWh) */
  retailPrice: number[];
  /** The price series for inbalance penalties */
  inbalancePenalty: number[];
  /** A textual description of the experiment */
  description: string;
  /** Number of time steps of the experiment */
  experimentLength: number;
  /** Identifier of the experiment description */
  id: string;
}
