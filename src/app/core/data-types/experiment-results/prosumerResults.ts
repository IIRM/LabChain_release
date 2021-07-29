import {ReducedTransactionFeeEntry, TransactionFeeEntry} from "../TransactionFeeEntry";
import {InbalanceFee} from "../InbalanceFee";

export interface ProsumerResults{
    paidFees: ReducedTransactionFeeEntry[];
    finalAmountTokens: number;
}
