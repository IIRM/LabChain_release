import {RawOffer} from './RawOffer';

export interface TransactionData {
  transactionHash: string;
  explorerLink: string;
}

export interface BlockchainResponse {
  message: string;
  transactionData: TransactionData;
}

export interface RawOfferReturnObject {
  bids: Array<RawOffer>;
}
