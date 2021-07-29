import {BlockchainParticipant} from './BlockchainResource';

export interface PowerSeriesEntry {
  amount: number;
  price: number;
}

export interface Purchaser {
  gridOperator: BlockchainParticipant;
  shares: number[];
}

export interface PowerSeries {
  series: Array<PowerSeriesEntry>;
  purchasers: Array<Purchaser>;
}

export interface RawOffer {
  marketParticipant: BlockchainParticipant;
  resourceID: string;
  positivePowerSeries: PowerSeries;
  negativePowerSeries: PowerSeries;
  timeframe: number;
}

