import {PhysicalTrade} from "./P2POption";

export enum MarketParticipantType{
    Prosumer,
    GridOperator,
    Retailer
}

export interface MarketParticipant{
    /** The numerical identification of the MarketParticipant */
    id: number;
    type: MarketParticipantType;
}

export interface OffmarketTrade extends PhysicalTrade {
    payer: MarketParticipant;
    payee: MarketParticipant;
    volume: number;
    deliveryTime: number;
    duration: number;
    power: number;
}
