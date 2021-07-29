import { Injectable } from '@angular/core';
import { P2POption, PhysicalTrade } from './data-types/P2POption';
import { SessionDataService } from "./session-data.service";
import { TransactionFeeEntry } from "./data-types/TransactionFeeEntry";
import { Subject } from "rxjs";
import { MarketParticipantType, OffmarketTrade } from "./data-types/OffmarketTrade";
import { ResidualLoadService } from "../prosumer/residual-load.service";
import { BlockchainRelayService } from "./interfaceRelayServices/blockchain-relay.service";


@Injectable({
  providedIn: 'root'
})

/**
 * Service to provide the financial clearing for transactions.
 * Listens to newly accepted transactions; upon detection of an uncleared transaction the participant is a party of,
 * payment is issued and book keeping done
 */
export class TransactionClearingService {

  /** The set of bids already cleared formerly by the service */
  private clearedBidIDs: Set<string>;
  /** The set of asks already cleared formerly by the service */
  private clearedAskIDs: Set<string>;
  //The emitters for newly cleared transactions in order to update the respective lists
  public newlyClearedBidEmitter = new Subject<TransactionFeeEntry>();
  public newlyClearedAskEmitter = new Subject<TransactionFeeEntry>();

  public gridActivityEmitter = new Subject<string>();

  constructor(private blockchain: BlockchainRelayService,
              private state: SessionDataService,
              private residualLoad: ResidualLoadService,
              private logger: ClearingLoggerService) {

    this.clearedBidIDs = new Set<string>();
    this.clearedAskIDs = new Set<string>();
    //Service listens to committed bids on the blockchain and upon reception checks whether transactions need clearing still
    this.blockchain.committedBidSubject.subscribe(committedBids => {
      console.log('clearing receives com bids');
      committedBids.forEach(currentBid => {
        if(!this.clearedBidIDs.has(currentBid.id)){
          this.clearBidCommitment(currentBid, this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.feeAmount);
        }
      });
    });
    //Service listens to committed asks on the blockchain and upon reception checks whether transactions need clearing still
    this.blockchain.committedAskSubject.subscribe(committedAsks => {
      committedAsks.forEach(currentAsk => {
        if(!this.clearedAskIDs.has(currentAsk.id)){
          this.clearAskCommitment(currentAsk, this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.feeAmount);
        }
      });
    });
  }

  /**
   * Method to clear a bid commitment with the respective actors.
   * Decreases the tokens of the author of the bid by the price and the transaction fee and increases the tokens of the buyer by the price of the bid.
   * Add the cleared bid to the record of cleared bids.
   *
   * @param committedBid The bid in question
   * @param transactionFeeAmount The amount of transaction fee to be retained
   */
  clearBidCommitment(committedBid: P2POption, transactionFeeAmount: number): void {
    if (!this.clearedBidIDs.has(committedBid.id)) {
      console.log(committedBid.id + ' is not yet cleared');
      //find value by total transacted power and price/unit
      const bidValue = (committedBid.price * committedBid.power * committedBid.duration);
      const transactionFee = {
        payerID: committedBid.optionCreator.respectiveProsumer.id,
        amount: (bidValue * transactionFeeAmount),
        correspondingTransaction: committedBid
      };
      //check if participant is one of the counter parties and clear the bid
      //The Bid option creator offers to pay for delivery of electricity, i.e. money is counted negatively, energy positively
      if (this.state.currentProsumer!.respectiveProsumer.id === committedBid.optionCreator.respectiveProsumer.id){
        this.state.currentProsumer!.processPayment(-1 * ((1 + transactionFeeAmount) * bidValue), ' clearing bid ' + committedBid.id);
        this.state.currentProsumer!.addIncurredFee(transactionFee);
        this.processPhysicalWithdrawel({
          deliveryTime: committedBid.deliveryTime,
          duration: committedBid.duration,
          power: committedBid.power
        });
      }
      //The Bid accepting party agrees to sell electricity against the offered money, i.e. money is counted positively, energy negatively
      else if (this.state.currentProsumer!.respectiveProsumer.id === committedBid.acceptedParty) {
        this.state.currentProsumer!.processPayment(bidValue, ' accepting party of a bid');
        this.processPhysicalInjection({
          deliveryTime: committedBid.deliveryTime,
          duration: committedBid.duration,
          power: committedBid.power
        });
      }
      //Mark bid as being cleared (from the perspective of the current participant
      this.clearedBidIDs.add(committedBid.id);
      this.newlyClearedBidEmitter.next(transactionFee);
    } else {
      throw new Error ('bid with id ' + committedBid.id + ' has already been cleared before');
    }
  }

  /**
   * Method to clear a ask commitment with the respective actors.
   * Increases the tokens of the seller by the price minus the transaction fees and decreases the tokens from the option creator by the price of the ask.
   * Add the cleared ask to the record of cleared asks.
   *
   * @param committedAsk The ask in question
   * @param transactionFeeAmount The amount of transaction fee to be retained
   */
  clearAskCommitment(committedAsk: P2POption, transactionFeeAmount: number): void {
    //inline comments see clearBidCommitment
    if (!this.clearedAskIDs.has(committedAsk.id)) {
      const askValue = (committedAsk.price * committedAsk.power * committedAsk.duration);
      const transactionFee: TransactionFeeEntry = {
        payerID: committedAsk.acceptedParty,
        amount: (askValue * transactionFeeAmount),
        correspondingTransaction: committedAsk
      };
      //The Ask option creator offers to deliver electricity against money, i.e. money is counted positively, energy negatively
      if (this.state.currentProsumer!.respectiveProsumer.id === committedAsk.optionCreator.respectiveProsumer.id){
        this.state.currentProsumer!.processPayment(((1 - transactionFeeAmount) * askValue), 'creator of a clearing ask ');
        this.state.currentProsumer!.addIncurredFee(transactionFee);
        this.processPhysicalInjection({
          deliveryTime: committedAsk.deliveryTime,
          duration: committedAsk.duration,
          power: committedAsk.power
        });
      }
      //The Ask accepting seeks to consume electricity against money, i.e. money is counted negatively, energy positively
      else if (this.state.currentProsumer!.respectiveProsumer.id === committedAsk.acceptedParty) {
        this.state.currentProsumer!.processPayment(-1 * askValue, ' accepting party of a clearing ask');
        this.processPhysicalWithdrawel({
          deliveryTime: committedAsk.deliveryTime,
          duration: committedAsk.duration,
          power: committedAsk.power
        });
      }
      this.clearedAskIDs.add(committedAsk.id);
      this.newlyClearedAskEmitter.next(transactionFee);
    } else {
      throw new Error ('ask with id ' + committedAsk.id + ' has already been cleared before');
    }
  }

  /**
   * Method to account for trades off the P2P market (sale of electricity to the grid operator or purchase of electricity from the retailer).
   * Method to processes these transactions from the perspective of the prosumer
   * @param respectiveTrade The trade that is to be processed
   */
  clearOffMarketTrade(respectiveTrade: OffmarketTrade){
    this.logger.clearingLog('About to clear the following offmarket trade ', 2);
    this.logger.clearingLog(respectiveTrade.toString(), 2);
    this.logger.clearingLog('payer type '+ respectiveTrade.payer.type + '; payee type ' + respectiveTrade.payee.type, 3);
    if(respectiveTrade.payee.type === MarketParticipantType.Prosumer){
      if(this.state.currentProsumer!.respectiveProsumer.id === respectiveTrade.payee.id){
        this.state.currentProsumer!.processPayment(respectiveTrade.volume, 'selling party in an off market transaction');
        this.logger.clearingLog('Processing payee as prosumer ', 3);
        this.processPhysicalInjection({
          deliveryTime: respectiveTrade.deliveryTime,
          duration: respectiveTrade.duration,
          power: respectiveTrade.power
        });
      }
    } else if (respectiveTrade.payer.type === MarketParticipantType.Prosumer){
      if(this.state.currentProsumer!.respectiveProsumer.id === respectiveTrade.payer.id){
        this.state.currentProsumer!.processPayment(-1 * respectiveTrade.volume, 'buying party in an offmarket transaction');
        this.logger.clearingLog('Processing payer as prosumer ', 3);
        this.processPhysicalWithdrawel({
          deliveryTime: respectiveTrade.deliveryTime,
          duration: respectiveTrade.duration,
          power: respectiveTrade.power
        });
      }
    }
  }

  /**
   * Method to process the physical delivery of a trade where the current prosumer is the party agreeing to inject electricity in the grid
   * Processed through adding the market activity in the residual load component as central authority for the energy balance
   * @param trade The respective trade
   */
  private processPhysicalInjection(trade: PhysicalTrade){
    //As the trade concerned a physical injection of the customer, the power value is interpreted to be positive (add as a load)
    for(let i=0; i<trade.duration; i++){
      this.residualLoad.addMarketActivity(trade.deliveryTime+i, (-1) * trade.power);
    }
    this.residualLoad.drawRL();
    this.gridActivityEmitter.next('injection');
  }

  /**
   * Method to process the physical delivery of a trade where the current prosumer is the party agreeing to withdraw electricity from the grid
   * Processed through adding the market activity in the residual load component as central authority for the energy balance
   * @param trade The respective trade
   */
  private processPhysicalWithdrawel(trade: PhysicalTrade){
    //As the trade concerned a physical withdrawel of the customer, the power value is interpreted to be negative (add as a generation)
    for(let i=0; i<trade.duration; i++){
      this.residualLoad.addMarketActivity(trade.deliveryTime+i, trade.power);
    }
    this.residualLoad.drawRL();
    this.gridActivityEmitter.next('withdrawel');
  }
}

/**
 * Helper service to log clearing-specific information to the console.
 * Allows for specifying the level of to print based on the priority of the message.
 * Furthermore it provide different logging domains for more fine-grained control.
 */
export class ClearingLoggerService {

  private detailLevel = 4;

  constructor() {
  }

  public clearingLog(logMessage: string, priority: number) {
    if (priority <= this.detailLevel) {
      console.log(logMessage);
    }
  }
}
