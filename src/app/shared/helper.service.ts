import { Injectable } from '@angular/core';
import {ProsumerInstance} from "../core/data-types/ProsumerInstance";
import {ReducedTransactionFeeEntry, TransactionFeeEntry} from "../core/data-types/TransactionFeeEntry";

@Injectable({
  providedIn: 'root'
})

/**
 * Service to provide the helper service to be used in other context for stateless functionality not directly relevant for the functionality of the respective component/service
 */
export class HelperService {

  constructor() { }

  /**
   * Method to aggregate a number of arrays on an element-by-element base.
   * Additively aggregates the n-th element of each array in the n-th entry of the returned array.
   *
   * @param arrays Array with entries as the additive aggregate of the provided arrays
   */
  //TODO include check if more than 1 array is provided?
  aggregateArrays(arrays: number[][]) {
    const aggregatedArrays = Array(arrays[0].length).fill(0);
    const indexRange = Array.from(Array(arrays[0].length).keys());
    for (const index of indexRange) {
      arrays.forEach(currentArray => {
        if (!isNaN(currentArray[index])) {
          aggregatedArrays[index] += currentArray[index];
        }
      });
      aggregatedArrays[index] = Math.round(aggregatedArrays[index] * 1000) / 1000;
    }
    return aggregatedArrays;
  }

  /**
   * Method to find the elements in setA that do not appear in setB.
   * Adopted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
   * @param setA
   * @param setB
   */
  static difference(setA: Set<string>, setB: Set<string>): Set<string> {
    const difference = new Set<string>(setA);
    setB.forEach( elem => {
      difference.delete(elem);
    });
    return difference;
  }

  /** Method to round a number up to three decimals */
  public roundPower(power: number) {
    return Math.round(power * 1000)/1000;
  }

  /** Method to round a number up to two decimals */
  public roundTokens(tokens: number) {
    return Math.round(tokens * 100) / 100;
  }

  public static retrieveProsumerInstance(id: number, prosumers: ProsumerInstance[]): ProsumerInstance{
    let prosumerFound: ProsumerInstance = null;
    prosumers.forEach(currentProsumer => {
      //console.log("comparing prosumer id " + currentProsumer.respectiveProsumer.id + " of type " + typeof currentProsumer.respectiveProsumer.id + " with seeked id "+ id + " of type " + typeof  id);
      if (currentProsumer.respectiveProsumer.id === id){
        if (prosumerFound === null){
          prosumerFound = currentProsumer;
        } else {
          console.error("Several prosumers found with id " + id + "!! error! error!");
        }
      }
    });
    return prosumerFound;
  }

    static reducedTransactionCaster(transactionFee: TransactionFeeEntry): ReducedTransactionFeeEntry {
      if(transactionFee.correspondingTransaction.optionCreator && transactionFee.correspondingTransaction.acceptedParty){
        return {
          payer: transactionFee.payerID,
          amount: transactionFee.amount,
          correspondingTransaction: {
            acceptedParty: transactionFee.correspondingTransaction.acceptedParty,
            id: transactionFee.correspondingTransaction.id,
            duration: transactionFee.correspondingTransaction.duration,
            deliveryTime: transactionFee.correspondingTransaction.deliveryTime,
            optionCreator: transactionFee.correspondingTransaction.optionCreator.respectiveProsumer.id,
            price: transactionFee.correspondingTransaction.price,
            power: transactionFee.correspondingTransaction.power
          }
        }
      } else if (transactionFee.correspondingTransaction.optionCreator) {
        return {
          payer: transactionFee.payerID,
          amount: transactionFee.amount,
          correspondingTransaction: {
            acceptedParty: null,
            id: transactionFee.correspondingTransaction.id,
            duration: transactionFee.correspondingTransaction.duration,
            deliveryTime: transactionFee.correspondingTransaction.deliveryTime,
            optionCreator: transactionFee.correspondingTransaction.optionCreator.respectiveProsumer.id,
            price: transactionFee.correspondingTransaction.price,
            power: transactionFee.correspondingTransaction.power
          }
        }
      } else {
        console.log('ERROR! Transaction without parties encountered!!');
        return null;
      }
    }
}
