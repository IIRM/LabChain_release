import {Context} from "./Context";
import {P2POption, ReducedP2POption} from "../P2POption";
import {ResultLoggerService} from "./result-logger.service";
import {ProsumerInstance} from "../ProsumerInstance";
import {InbalanceFee} from "../InbalanceFee";

export interface MarketContext extends Context{
    amountTokens: number;
}

export class FilterSetting {
    maxPrice: number;
    minDeliveryTime: number;
    maxDeliveryTime: number;
    minDuration: number;
    maxDuration: number;
    minPower: number;
    maxPower: number;
    constructor(maxPrice: number, minDeliveryTime: number, maxDeliveryTime: number, minDuration: number,
                maxDuration: number, minPower: number, maxPower: number){
        this.maxPrice = maxPrice;
        this.minDeliveryTime = minDeliveryTime;
        this.maxDeliveryTime = maxDeliveryTime;
        this.minDuration = minDuration;
        this.maxDuration = maxDuration;
        this.minPower = minPower;
        this.maxPower = maxPower;
    }
    toDictionary(){
        return{
            maxPrice: this.maxPrice,
            minDeliveryTime: this.minDeliveryTime,
            maxDeliveryTime: this.maxDeliveryTime,
            minDuration: this.minDuration,
            maxDuration: this.maxDuration,
            minPower: this.minPower,
            maxPower: this.maxPower
        }
    }
}

export interface CommittedOfferContext extends MarketContext{
    filterSetting: FilterSetting;
}

export class OfferResult{
    correspondingOffer: ReducedP2POption;
    context: MarketContext;
    constructor(correspondingOffer: P2POption, context: MarketContext) {
        if(correspondingOffer.acceptedParty) {
            this.correspondingOffer = {
                power: correspondingOffer.power,
                acceptedParty: correspondingOffer.acceptedParty,
                price: correspondingOffer.price,
                optionCreator: correspondingOffer.optionCreator.respectiveProsumer.id,
                deliveryTime: correspondingOffer.deliveryTime,
                duration: correspondingOffer.duration,
                id: correspondingOffer.id
            };
        } else {
            this.correspondingOffer = {
                power: correspondingOffer.power,
                acceptedParty: NaN,
                price: correspondingOffer.price,
                optionCreator: correspondingOffer.optionCreator.respectiveProsumer.id,
                deliveryTime: correspondingOffer.deliveryTime,
                duration: correspondingOffer.duration,
                id: correspondingOffer.id
            }
        }
            this.context = context;
    }
    toDictionary(){
        return {
            correspondingOffer: {
                id: this.correspondingOffer.id,
                optionCreator: this.correspondingOffer.optionCreator,
                deliveryTime: this.correspondingOffer.deliveryTime,
                duration: this.correspondingOffer.duration,
                price: this.correspondingOffer.price,
                power: this.correspondingOffer.power,
                acceptedParty: this.correspondingOffer.acceptedParty
            },
            context: {
                amountTokens: this.context.amountTokens,
                t: this.context.t
            }
        }
    }
}

export class CommittedOfferResult{
    correspondingOffer: ReducedP2POption;
    context: CommittedOfferContext;
    constructor(correspondingOffer: P2POption, context: CommittedOfferContext) {
        console.log(correspondingOffer);
        this.correspondingOffer = {
            power: correspondingOffer.power,
            acceptedParty: correspondingOffer.acceptedParty,
            price: correspondingOffer.price,
            optionCreator: correspondingOffer.optionCreator.respectiveProsumer.id,
            deliveryTime: correspondingOffer.deliveryTime,
            duration: correspondingOffer.duration,
            id: correspondingOffer.id
        };
        this.context = context;
    }
    toDictionary(){
        return {
            correspondingOffer: {
                id: this.correspondingOffer.id,
                optionCreator: this.correspondingOffer,
                deliveryTime: this.correspondingOffer.deliveryTime,
                duration: this.correspondingOffer.duration,
                price: this.correspondingOffer.price,
                power: this.correspondingOffer.power,
                acceptedParty: this.correspondingOffer
            },
            context: {
                amountTokens: this.context.amountTokens,
                t: this.context.t,
                filterSetting: this.context.filterSetting
            }
        }
    }
}

export class ThirdPartyInteractionResult{
    volume: number;
    power: number;
    context: MarketContext;
    constructor(volume: number, power: number, context: MarketContext) {
        this.power = power;
        this.volume = volume;
        this.context = context;
    }
    toDictionary(){
        return {
            volume: this.volume,
            power: this.power,
            context: {
                amountTokens: this.context.amountTokens,
                t: this.context.t
            }
        }
    }
}

export class MarketResults {
    bidMarketActivity: Array<OfferResult> = [];
    askMarketActivity: Array<OfferResult> = [];
    bidCommitmentMarketActivity: Array<CommittedOfferResult> = [];
    askCommitmentMarketActivity: Array<CommittedOfferResult> = [];
    feedInActivity: Array<ThirdPartyInteractionResult> = [];
    retailActivity: Array<ThirdPartyInteractionResult> = [];
    toDictionary(){
        return {
            bidMarketActivity: this.bidMarketActivity.map(offerResult => offerResult.toDictionary()),
            askMarketActivity: this.askMarketActivity.map(offerResult => offerResult.toDictionary()),
            bidCommitmentMarketActivity: this.bidCommitmentMarketActivity.map(offerResult => offerResult.toDictionary()),
            askCommitmentMarketActivity: this.askCommitmentMarketActivity.map(offerResult => offerResult.toDictionary()),
            feedInActivity: this.feedInActivity.map(interactionResult => interactionResult.toDictionary()),
            retailActivity: this.retailActivity.map(interactionResult => interactionResult.toDictionary())
        }
    }
}

export class MarketResultManager{
    private bidMarketActivity: Array<OfferResult> = new Array<OfferResult>();
    private askMarketActivity: Array<OfferResult> = new Array<OfferResult>();
    private bidCommitmentMarketActivity: Array<CommittedOfferResult> = new Array<CommittedOfferResult>();
    private askCommitmentMarketActivity: Array<CommittedOfferResult> = new Array<CommittedOfferResult>();
    private feedInActivity: Array<ThirdPartyInteractionResult> = new Array<ThirdPartyInteractionResult>();
    private retailActivity: Array<ThirdPartyInteractionResult> = new Array<ThirdPartyInteractionResult>();
    private inbalanceFees: Array<InbalanceFee> = new Array<InbalanceFee>();
    constructor() {

    }
    recordBidMarketActivity(bid: P2POption, time: number, tokens: number){
        this.bidMarketActivity.push(new OfferResult(bid, {amountTokens: tokens, t: time}));
        ResultLoggerService.marketResultLog('Recording the following bid in context ', 2);
        ResultLoggerService.marketResultLog({bid: bid, amountTokens: tokens, t: time}, 2);
    }
    recordAskMarketActivity(ask: P2POption, time: number, tokens: number){
        this.askMarketActivity.push(new OfferResult(ask, {amountTokens: tokens, t: time}));
        ResultLoggerService.marketResultLog('Recording the following ask in context ', 2);
        ResultLoggerService.marketResultLog({ask: ask, amountTokens: tokens, t: time}, 2);
    }
    recordBidCommitmentMarketActivity(bid: P2POption, acceptingProsumer: ProsumerInstance, time: number, tokens: number, filterSetting: FilterSetting){
        let augmentedBid = bid;
        augmentedBid.acceptedParty = acceptingProsumer.respectiveProsumer.id;
        this.bidCommitmentMarketActivity.push(new CommittedOfferResult(augmentedBid, {amountTokens: tokens, t: time, filterSetting: filterSetting}));
        ResultLoggerService.marketResultLog('Recording the following bid commitment in context ', 2);
        ResultLoggerService.marketResultLog({bid: bid, amountTokens: tokens, t: time, filterSetting: filterSetting}, 2);
    }
    recordAskCommitmentMarketActivity(ask: P2POption, acceptingProsumer: ProsumerInstance, time: number, tokens: number, filterSetting: FilterSetting){
        let augmentedAsk = ask;
        augmentedAsk.acceptedParty = acceptingProsumer.respectiveProsumer.id;
        this.askCommitmentMarketActivity.push(new CommittedOfferResult(augmentedAsk, {amountTokens: tokens, t: time, filterSetting: filterSetting}));
        ResultLoggerService.marketResultLog('Recording the following ask commitment in context ', 2);
        ResultLoggerService.marketResultLog({ask: ask, amountTokens: tokens, t: time, filterSetting: filterSetting}, 2);
    }
    recordFeedInActivity(volume: number, power:number, time: number, tokens: number){
        this.feedInActivity.push(new ThirdPartyInteractionResult(volume, power, {amountTokens: tokens, t: time}));
        ResultLoggerService.marketResultLog('Recording the following feedin activity in context ', 2);
        ResultLoggerService.marketResultLog({volume: volume, power: power, amountTokens: tokens, t: time}, 2);
    }
    recordRetailActivity(volume: number, power: number, time: number, tokens: number){
        this.retailActivity.push(new ThirdPartyInteractionResult(volume, power,{amountTokens: tokens, t: time}));
        ResultLoggerService.marketResultLog('Recording the following retail activity in context ', 2);
        ResultLoggerService.marketResultLog({volume: volume, power: power, amountTokens: tokens, t: time}, 2);
    }
    retrieveMarketActivity(){
        return {
            bidMarketActivity: this.bidMarketActivity,
            askMarketActivity: this.askMarketActivity,
            bidCommitmentMarketActivity: this.bidCommitmentMarketActivity,
            askCommitmentMarketActivity: this.askCommitmentMarketActivity,
            feedInActivity: this.feedInActivity,
            retailActivity: this.retailActivity,
            inbalanceFees: this.inbalanceFees
        }
    }
    toDictionary(){
        return {
            bidMarketActivity: this.bidMarketActivity.map(marketActivity => marketActivity.toDictionary()),
            askMarketActivity: this.askMarketActivity.map(marketActivity => marketActivity.toDictionary()),
            bidCommitmentMarketActivity: this.bidCommitmentMarketActivity.map(marketActivity => marketActivity.toDictionary()),
            askCommitmentMarketActivity: this.askCommitmentMarketActivity.map(marketActivity => marketActivity.toDictionary()),
            feedInActivity: this.feedInActivity.map(marketActivity => marketActivity.toDictionary()),
            retailActivity: this.retailActivity.map(marketActivity => marketActivity.toDictionary()),
            inbalanceFees: this.inbalanceFees
        }
    }

    recordInbalanceFee(inbalanceFee: { timeStep: number; inbalancePaid: number; inbalancePower: number }) {
        this.inbalanceFees.push(inbalanceFee);
    }
}
