import {ProsumerInstance} from './ProsumerInstance';
import {PowerSeriesEntry, Purchaser} from './response-types/RawOffer';

export interface Committment {
    /** The fraction of the offer that the counter party is taking up */
    share: number;
}

export enum OfferType{
    Ask,
    Bid
}

export interface BlockchainOffer {
    /** Author of the offer **/
    authorProsumer: ProsumerInstance;
    /** Corresponding resource **/
    resourceID: string;
    /** Offer type (bid-style or ask-style offer (issued by seller or buyer)) **/
    offerType: OfferType;
    /** powerSeries describing the power and price associated with the offer**/
    powerSeries: Array<PowerSeriesEntry>;
    /** purchasers information of the power series **/
    purchasers: Array<Purchaser>;
}
