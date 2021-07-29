import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {BlockchainOffer, OfferType} from '../data-types/BlockchainOffer';
import {RawOffer} from '../data-types/response-types/RawOffer';
import {OfferWatcherService} from './offer-watcher.service';
import {SessionDataService} from '../session-data.service';
import {BlockchainLoggerService} from './blockchain-logger.service';
import {P2POption} from '../data-types/P2POption';
import {ProsumerInstance} from '../data-types/ProsumerInstance';
import {HelperService} from "../../shared/helper.service";

@Injectable({
  providedIn: 'root'
})
/**
 * The BlockchainOfferProcessorService serves to transform the offers found on the RawOfferStream into the respective bid and ask sorted P2POptions.
 * It transforms these data structures (RawOffers) into data of type BlockchainOffer by associating the respective experiment participant and checking for offer type.
 * It furthermore detects the resources that are used and emits them on the resourceInUseStream.
 *
 */
export class BlockchainOfferProcessorService {

  /** Stream for propagating the Bid offers as P2POption **/
  public P2PBidStream: Subject<P2POption[]> = new Subject<P2POption[]>();
  /** Stream for propagating the Ask offers as P2POption **/
  public P2PAskStream: Subject<P2POption[]> = new Subject<P2POption[]>();
  /** Stream to emit the resources used in transactions **/
  public resourceInUseStream: Subject<Set<string>> = new Subject<Set<string>>();

  constructor(
    private offerWatcherService: OfferWatcherService,
    private session: SessionDataService,
    private logger: BlockchainLoggerService
  ) {
    this.logger.offerPipelineLog('Committed offer filter initialized', 3);
    //Listen to the new rawOffers as detected on the blockchain and invoke the transformation
    this.offerWatcherService.rawOfferStream.subscribe(rawOfferTimesliceMap => {
      this.logger.offerPipelineLog("receiving the raw offers with a total of " + rawOfferTimesliceMap.size + ' trading frames', 3);
      this.logger.offerPipelineLog(rawOfferTimesliceMap.toString(), 3);
      rawOfferTimesliceMap.forEach((rawOffers, timeStep) => {
        this.logger.offerPipelineLog('Offer Processor received ' + rawOffers.length + ' offers for time frame '+ timeStep, 4);
      });
      //invoke service core functionality
      this.emitStreams(this.rawOffersToBlockchainOffers(rawOfferTimesliceMap));
    });
  }

  /**
   * Function to separate the blockchain offers into bid and ask offers, transform them to P2POptions and emit them on the respective streams
   * @param blockchainOfferMap Map associating the time steps in the simulation with an array of BlockchainOffers belonging to this experiment and the time step (as starting time)
   */
  private emitStreams(blockchainOfferMap: Map<number, BlockchainOffer[]>): void {
    const bidOffers: Array<P2POption> = new Array<P2POption>();
    const askOffers: Array<P2POption> = new Array<P2POption>();
    const resourcesInUse: Set<string> = new Set<string>();
    this.logger.offerPipelineLog('Received map of blockchain offers comprises ' + blockchainOfferMap.size + ' entries', 4);
    //Iterate through the time steps of interest and the offers retrieved for these time stamps
    blockchainOfferMap.forEach(((value, key) => {
      value.forEach(currentBlockchainOffer => {
        //For each offer retrieve the ID of the corresponding resource, filter by offer type and cast them into P2POffers
        resourcesInUse.add(currentBlockchainOffer.resourceID);
        if (currentBlockchainOffer.offerType === OfferType.Bid){
          bidOffers.push(this.transformToP2POption(currentBlockchainOffer, key));
        } else if (currentBlockchainOffer.offerType === OfferType.Ask){
          askOffers.push(this.transformToP2POption(currentBlockchainOffer, key));
        } else {
          console.error('Offer type of offer ' + currentBlockchainOffer + ' is invalid (value ' + currentBlockchainOffer.offerType + ')!!');
        }
      });
    }));
    //After filtering the offers, emit the respective streams to the listeners
    this.logger.offerPipelineLog('emitting stream of askOffers with ' + askOffers.length + ' relevant offers', 4);
    this.P2PAskStream.next(askOffers);
    this.logger.offerPipelineLog('emitting stream of bidOffers with ' + bidOffers.length + ' relevant offers', 4);
    this.P2PBidStream.next(bidOffers);
    this.resourceInUseStream.next(resourcesInUse);
  }
  //TODO could be optimized by cutting out the BlockchainOffer intermediary representation
  /**
   * Function to transform map of RawOffers into a map of BCOffers (primarily by selecting on offer type) and to filter them based on whether they belong to a resource used in the experiment
   * @params Map with the time steps of interest (simulation time) and the the array of RawOffers starting at this time step
   * @return A transformed map filtered by irrelevant offers (not belonging to this experiment) and transformed into BlockchainOffers
   */
  private rawOffersToBlockchainOffers(rawOfferMap: Map<number, RawOffer[]>): Map<number, BlockchainOffer[]> {
    const returnMap: Map<number, BlockchainOffer[]> = new Map<number, BlockchainOffer[]>();
    this.logger.offerPipelineLog('Attempting to transform offers of ' + rawOfferMap.size + ' time steps into RawOffers', 5);
    //Iterate through all trading frames and offers
    rawOfferMap.forEach((rawOfferArray, key) => {
      const transformedArray: Array<BlockchainOffer> = new Array<BlockchainOffer>();
      this.logger.offerPipelineLog('Relevant raw offers for time step ' + key + ': ' + rawOfferArray.length, 3);
      rawOfferArray.forEach(currentRawOffer => {
        //check whether the associated resource belongs to this experiment (same design and instance)
        if ((currentRawOffer.resourceID.split('-')[0] === this.session.experimentInstance.instanceOfExperiment.id.toString()) && (currentRawOffer.resourceID.split('-')[1] === this.session.experimentInstance.experimentID.toString())){
          //retrieve the prosumerInstance corresponding to the market participant in the RawOffer
          const correspondingProsumerInstance = HelperService.retrieveProsumerInstance(currentRawOffer.marketParticipant.id, this.session.experimentProsumers);
          //Determine offer type and create the respective representation
          const offerType = this.determineOfferType(currentRawOffer);
          if (offerType === OfferType.Ask) {
            transformedArray.push({
              authorProsumer: correspondingProsumerInstance,
              resourceID: currentRawOffer.resourceID,
              offerType: OfferType.Ask,
              powerSeries: currentRawOffer.positivePowerSeries.series,
              purchasers: currentRawOffer.positivePowerSeries.purchasers
            });
          } else if (offerType === OfferType.Bid) {
            transformedArray.push({
              authorProsumer: correspondingProsumerInstance,
              resourceID: currentRawOffer.resourceID,
              offerType: OfferType.Bid,
              powerSeries: currentRawOffer.negativePowerSeries.series,
              purchasers: currentRawOffer.negativePowerSeries.purchasers
            });
          } else {
            throw new Error("error! Offer type of current entry is invalid!");
          }
        }
        else {
          this.logger.offerPipelineLog('Offers belongs to a resource not belonging to the experiment (' + currentRawOffer.resourceID + ')', 3);
        }
      });
      //Associate the respective offers for the time step with the time step
      returnMap.set(key, transformedArray);
    });
    //After all time steps are processed, return the map
    return returnMap;
  }

  /**
   * More functional version of the transformation function
   * Function to transform map of RawOffers into a map of BCOffers (primarily by selecting on offer type) and to filter them based on whether they belong to a resource used in the experiment
   * @params Map with the time steps of interest (simulation time) and the the array of RawOffers starting at this time step
   * @return A transformed map filtered by irrelevant offers (not belonging to this experiment) and transformed into BlockchainOffers
   */
  private rawOffersToBlockchainOffersAlterantive(rawOfferMap: Map<number, RawOffer[]>): Map<number, BlockchainOffer[]> {
    const returnMap: Map<number, BlockchainOffer[]> = new Map<number, BlockchainOffer[]>();
    this.logger.offerPipelineLog('Attempting to transform offers of ' + rawOfferMap.size + ' time steps into RawOffers', 5);
    //Iterate through all time steps and offers
    rawOfferMap.forEach((rawOfferArray, key) => {
      //Associate the respective offers for the time step with the time step
      returnMap.set(key, rawOfferArray.map(currentOffer => this.transformOffer(currentOffer)));
    });
    //After all time steps are processed, return the map
    return returnMap;
  }

  /**
   * Function to transform a raw offer extracted from the blockchain to a blockchainOffer.
   * It associates the respective experiment participant and filters for the respective bid type.
   *
   * @param currentRawOffer offer extracted from the Blockchain API as RawOffer
   * @return Transformed offer
   */
  private transformOffer(currentRawOffer: RawOffer): BlockchainOffer {
      const correspondingProsumerInstance = HelperService.retrieveProsumerInstance(currentRawOffer.marketParticipant.id, this.session.experimentProsumers);
      const offerType = this.determineOfferType(currentRawOffer);
      if (offerType === OfferType.Ask){
        return {
          authorProsumer: correspondingProsumerInstance,
          resourceID: currentRawOffer.resourceID,
          offerType: OfferType.Ask,
          powerSeries: currentRawOffer.positivePowerSeries.series,
          purchasers: currentRawOffer.positivePowerSeries.purchasers
        };
      } else if (offerType === OfferType.Bid){
        return {
          authorProsumer: correspondingProsumerInstance,
          resourceID: currentRawOffer.resourceID,
          offerType: OfferType.Bid,
          powerSeries: currentRawOffer.negativePowerSeries.series,
          purchasers: currentRawOffer.negativePowerSeries.purchasers
        };
      } else {
        throw new Error("error! Offer type of current entry is invalid!");
      }
  }

  /**
   * Helper function to determine if the respective offer is an ask or a bid offer.
   * Is determined by the positive and negative power series of the respective blockchain-side offer.
   * Tests different hypotheses (positive: an entry in the positivePowerSeries is non-zero, negative: same with negativePowerSeries)
   * and depending on
   *
   * @param blockchainOffer The offer for which the type should be determined
   * @return The type of the offer according to the power series (Bid/Ask)
   */
  private determineOfferType(blockchainOffer: RawOffer): OfferType {
    // Check positive and negative time series to find non-zero amount offers; a valid offer should only have one of either.
    let positiveHypothesis = false;
    let negativeHypothesis = false;
    blockchainOffer.positivePowerSeries.series.forEach(currentEntry => {
      if (currentEntry.amount > 0){
        positiveHypothesis = true;
      }
    });
    blockchainOffer.negativePowerSeries.series.forEach(currentEntry => {
      if (currentEntry.amount > 0){
        negativeHypothesis = true;
      }
    });
    //Determine offer type by whether it has non-zero entries on the positive or negative series
    if (positiveHypothesis && !negativeHypothesis) return OfferType.Ask;
    else if (negativeHypothesis && !positiveHypothesis) return OfferType.Bid;
    else if (positiveHypothesis && negativeHypothesis) throw new Error("error! Offer with both a positive and negative time series has been observed; offer type can't be determined!!! Resource ID: " + blockchainOffer.resourceID);
    else throw new Error("error! Offer with neither positive nor negative time series has been observed; Only offers with a non-zero amount should be admitted to the blockchain, something went terribly wrong somewhere. Resource ID: " + blockchainOffer.resourceID);
  }

  /**
   * Helper function to transform a BlockchainOffer to a P2POption by retrieving the prosumer corresponding to the purchaser (if applicable) and the number of non-zero entries as duration
   * @param blockchainOfferToTransform The BlockchainOffer to transform into a P2POption
   * @param tradingFrameOffset The time step in the simulation the trading frame is offset by
   */
  private transformToP2POption(blockchainOfferToTransform: BlockchainOffer, tradingFrameOffset: number): P2POption {
    let optionID;
    let purchaser: ProsumerInstance = null;
    //if the offer comprises buyers, find the prosumer corresponding to it (as partial offers aren't considered, there should only be one)
    if (blockchainOfferToTransform.purchasers.length > 0){
      this.logger.offerPipelineLog('P2POption has been purchased by someone ' + blockchainOfferToTransform.purchasers[0], 3);
      this.session.experimentProsumers.forEach(currentProsumer => {
        if (blockchainOfferToTransform.purchasers[0].gridOperator.id === currentProsumer.respectiveProsumer.id) {
          purchaser = currentProsumer;
        }
      });
      this.logger.offerPipelineLog('purchaser of BlockchainOffer is ' + purchaser, 3);
    }
    if (blockchainOfferToTransform.resourceID.split('-').length < 4) {
      console.error('Offer ' + blockchainOfferToTransform + ' is referring to an invalid resourceID ' + blockchainOfferToTransform.resourceID + '! They should have the form X-X-X-X!');
    } else {
      optionID = blockchainOfferToTransform.resourceID.split('-')[3];
    }
    this.logger.offerPipelineLog('Determining temporal parameters for offer ', 3);
    this.logger.offerPipelineLog(blockchainOfferToTransform.powerSeries.toString(), 3);
    let firstValidPowerEntry = 0;
    while (blockchainOfferToTransform.powerSeries[firstValidPowerEntry].amount === 0){
      firstValidPowerEntry++;
    }
    let lastValidPowerEntry = blockchainOfferToTransform.powerSeries.length - 1;
    while (blockchainOfferToTransform.powerSeries[lastValidPowerEntry].amount === 0){
      lastValidPowerEntry--;
    }
    this.logger.offerPipelineLog('First valid entry is ' + firstValidPowerEntry + ' and last is '+ lastValidPowerEntry, 3);
    this.logger.offerPipelineLog('Offer for trading frame time starting at ' + tradingFrameOffset + ' thus has a delivery time of ' + (tradingFrameOffset + firstValidPowerEntry) + ' and a duration of ' + (lastValidPowerEntry - firstValidPowerEntry), 4);
    return {
      id: optionID,
      optionCreator: blockchainOfferToTransform.authorProsumer,
      deliveryTime: (tradingFrameOffset + firstValidPowerEntry),
      duration: (lastValidPowerEntry - firstValidPowerEntry + 1),
      price: blockchainOfferToTransform.powerSeries[firstValidPowerEntry].price,
      power: (blockchainOfferToTransform.powerSeries[firstValidPowerEntry].amount / 1000.0),
      acceptedParty: purchaser.respectiveProsumer.id
    };
  }
}
