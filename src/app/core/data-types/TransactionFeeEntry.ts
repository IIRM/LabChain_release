import { P2POption, ReducedP2POption } from './P2POption';
import { ProsumerInstance } from './ProsumerInstance';

/**
 * Data structure to represent an entry in the transaction fee history.
 * Will list the respective transaction payed for a given transaction
 *
 * @param payerID The id of the actor that paid the respective transaction fee to the appropriate actor
 * @param amount The amount of transaction fee payed for the respective transaction
 * @param correspondingBid The bid in the electricity market the transaction fee was applied on (more precisely the bid used in the trade)
 */
export interface TransactionFeeEntry {
  /** The id of the actor that paid the respective transaction fee to the appropriate actor */
  payerID: number;
  /** The amount of transaction fee payed for the respective transaction */
  amount: number;
  /** The bid in the electricity market the transaction fee was applied on (more precisely the bid used in the trade) */
  correspondingTransaction: P2POption;
}

export interface ReducedTransactionFeeEntry {
  /** The id of the actor that paid the respective transaction fee to the appropriate actor */
  payer: number;
  /** The amount of transaction fee payed for the respective transaction */
  amount: number;
  /** The bid in the electricity market the transaction fee was applied on (more precisely the bid used in the trade) */
  correspondingTransaction: ReducedP2POption;
}

