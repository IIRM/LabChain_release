import { Injectable } from '@angular/core';
import {AngularFirestore} from "@angular/fire/firestore";
import {InbalanceFee} from "../core/data-types/InbalanceFee";
import {AssetSchedulingDataPoint} from "../core/data-types/experiment-results/assetSchedulingResults";
import {
  CommittedOfferResult, FilterSetting, MarketContext,
  OfferResult,
  ThirdPartyInteractionResult
} from "../core/data-types/experiment-results/marketResults";
import {P2POption, ReducedP2POption} from "../core/data-types/P2POption";

@Injectable({
  providedIn: 'root'
})
export class ExperimentResultService {
  prosumerID = 317;

  constructor(private db: AngularFirestore) {
  }


  getProsumerData(): Promise<string> {
    return new Promise<string>(resolve => {
      this.db.collection('experimentResults-isolation').doc('prosumer data for prosumer with id ' + this.prosumerID).get().subscribe(collection => {
        resolve('{ \n finalAmountTokens: ' + collection.data()!['finalAmountTokens'] + '\n}');
      });
    });
  }

  getMarketData(): Promise<string> {
    return new Promise(resolve => {
      this.db.collection('experimentResults-isolation').doc('prosumer market data for prosumer with id ' + this.prosumerID).get().subscribe(collection => {
        /**
         * Handle inbalance fees
         */
        const inbalanceFees = new Array<InbalanceFee>();
        let returnString = '\ninbalanceFees: [';
        const fees = collection.data()!['inbalanceFees'];
        fees.forEach((currentFee: InbalanceFee) => {
          returnString += '{ \n inbalancePaid: ' + currentFee['inbalancePaid'] + ', \n inbalancePower: ' + currentFee['inbalancePower'] + ', \n timeStep: ' + currentFee['timeStep'] + '\n},';
          inbalanceFees.push({
            inbalancePaid: currentFee['inbalancePaid'],
            inbalancePower: currentFee['inbalancePower'],
            timeStep: currentFee['timeStep']
          });
        });
        if(fees.size > 0){
          returnString = returnString.substring(0, returnString.length - 1);
        }
        /**
         * Handle bidMarketActivity
         */
        returnString += '\nbidMarketActivity: [';
        const bmActivity = collection.data()!['bidMarketActivity'];
        bmActivity.forEach((offer: OfferResult) => {
          const respectiveOffer = offer['correspondingOffer'];
          const marketContext = offer['context'];
          returnString += '{ \n ' +
              ' correspondingOffer: { \n '
              + 'id: ' + respectiveOffer['id'] + ', \n'
              + 'optionCreator: ' + respectiveOffer['optionCreator'] + ', \n'
              + 'deliveryTime: ' + respectiveOffer['deliveryTime'] + ', \n'
              + 'duration: ' + respectiveOffer['duration'] + ', \n'
              + 'price: ' + respectiveOffer['price'] + ', \n'
              + 'power: ' + respectiveOffer['power'] + ', \n'
              + 'acceptedParty: ' + respectiveOffer['acceptedParty'] + '\n}, {\n'
              + 'context: {\n '
              + 'amountTokens: ' + marketContext['amountTokens'] + ',\n'
              + 't: ' + marketContext['t'] + '\n}'
              + '\n},'
        });
        if(bmActivity.size > 0){
          returnString = returnString.substring(0, returnString.length - 1);
        }
        returnString += '\n],';
        /**
         * Handle askMarketActivity
         */
        returnString += '\naskMarketActivity: [';
        const amActivity = collection.data()!['askMarketActivity'];
        amActivity.forEach((offer: OfferResult) => {
          const respectiveOffer = offer['correspondingOffer'];
          const marketContext = offer['context'];
          returnString += '{ \n ' +
              ' correspondingOffer: { \n '
              + 'id: ' + respectiveOffer['id'] + ', \n'
              + 'optionCreator: ' + respectiveOffer['optionCreator'] + ', \n'
              + 'deliveryTime: ' + respectiveOffer['deliveryTime'] + ', \n'
              + 'duration: ' + respectiveOffer['duration'] + ', \n'
              + 'price: ' + respectiveOffer['price'] + ', \n'
              + 'power: ' + respectiveOffer['power'] + ', \n'
              + 'acceptedParty: ' + respectiveOffer['acceptedParty'] + '\n}, {\n'
              + 'context: {\n '
              + 'amountTokens: ' + marketContext['amountTokens'] + ',\n'
              + 't: ' + marketContext['t'] + '\n}'
              + '\n},';
        });
        returnString = returnString.substring(0, returnString.length - 1);
        returnString += '\n],\n';
        /**
         * Handle bidCommitmentMarketActivity
         */
        returnString += '\nbidCommitmentMarketActivity: [';
        const bcmActivity = collection.data()!['bidCommitmentMarketActivity'];
        bcmActivity.forEach((offer: CommittedOfferResult) => {
          const respectiveOffer = offer['correspondingOffer'];
          const commitmentContext = offer['context'];
          const filterSetting: FilterSetting = commitmentContext['filterSetting'];
          returnString += '{ \n ' +
              ' correspondingOffer: { \n '
              + 'id: ' + respectiveOffer['id'] + ', \n'
              + 'optionCreator: ' + respectiveOffer['optionCreator'] + ', \n'
              + 'deliveryTime: ' + respectiveOffer['deliveryTime'] + ', \n'
              + 'duration: ' + respectiveOffer['duration'] + ', \n'
              + 'price: ' + respectiveOffer['price'] + ', \n'
              + 'power: ' + respectiveOffer['power'] + ', \n'
              + 'acceptedParty: ' + respectiveOffer['acceptedParty'] + '\n}, {\n'
              + 'context: {\n ' +
              + 'filterSetting: {\n' +
              + 'maxPrice: ' + filterSetting['maxPrice'] + ',\n'
              + 'minDeliveryTime: ' + filterSetting['minDeliveryTime'] + ',\n'
              + 'maxDeliveryTime: ' + filterSetting['maxDeliveryTime'] + ',\n'
              + 'minDuration: ' + filterSetting['minDuration'] + ',\n'
              + 'maxDuration: ' + filterSetting['maxDuration'] + ',\n'
              + 'minPower: ' + filterSetting['minPower'] + ',\n'
              + 'maxPower: ' + filterSetting['maxPower'] + '\n},\n'
              + 'amountTokens: ' + commitmentContext['amountTokens'] + ',\n'
              + 't: ' + commitmentContext['t'] + '\n}'
              + '\n},';
        });
        if(bcmActivity.size > 0){
          returnString = returnString.substring(0, returnString.length - 1);
        }
        returnString += '\n],\n';
        /**
         * Handle askCommitmentMarketActivity
         */
        returnString += '\naskCommitmentMarketActivity: [';
        const acmActivity = collection.data()!['askCommitmentMarketActivity'];
        acmActivity.forEach((offer: CommittedOfferResult) => {
          const respectiveOffer = offer['correspondingOffer'];
          const commitmentContext = offer['context'];
          const filterSetting: FilterSetting = commitmentContext['filterSetting'];
          returnString += '{ \n ' +
              ' correspondingOffer: { \n '
              + 'id: ' + respectiveOffer['id'] + ', \n'
              + 'optionCreator: ' + respectiveOffer['optionCreator'] + ', \n'
              + 'deliveryTime: ' + respectiveOffer['deliveryTime'] + ', \n'
              + 'duration: ' + respectiveOffer['duration'] + ', \n'
              + 'price: ' + respectiveOffer['price'] + ', \n'
              + 'power: ' + respectiveOffer['power'] + ', \n'
              + 'acceptedParty: ' + respectiveOffer['acceptedParty'] + '\n}, {\n'
              + 'context: {\n ' +
              + 'filterSetting: {\n' +
              + 'maxPrice: ' + filterSetting['maxPrice'] + ',\n'
              + 'minDeliveryTime: ' + filterSetting['minDeliveryTime'] + ',\n'
              + 'maxDeliveryTime: ' + filterSetting['maxDeliveryTime'] + ',\n'
              + 'minDuration: ' + filterSetting['minDuration'] + ',\n'
              + 'maxDuration: ' + filterSetting['maxDuration'] + ',\n'
              + 'minPower: ' + filterSetting['minPower'] + ',\n'
              + 'maxPower: ' + filterSetting['maxPower'] + '\n},\n'
              + 'amountTokens: ' + commitmentContext['amountTokens'] + ',\n'
              + 't: ' + commitmentContext['t'] + '\n}'
              + '\n},';
        });
        if(acmActivity.size > 0){
          returnString = returnString.substring(0, returnString.length - 1);
        }
        returnString += '\n],\n';
        /**
         * Handle feedInActivity
         */
        returnString += '\nfeedInActivity: [';
        const fitActivity = collection.data()!['feedInActivity'];
        fitActivity.forEach((activity: ThirdPartyInteractionResult ) => {
          const marketContext = activity['context'];
          returnString += '{ \n ' +
              + 'power: ' + activity['power'] + ', \n'
              + 'volume: ' + activity['volume'] + ', \n'
              + 'context: {\n '
              + 'amountTokens: ' + marketContext['amountTokens'] + ',\n'
              + 't: ' + marketContext['t'] + '\n}'
              + '\n},';
        });
        if(fitActivity.size > 0){
          returnString = returnString.substring(0, returnString.length - 1);
        }
        returnString += '\n],\n';
        /**
         * Handle retailActivity
         */
        returnString += '\nretailActivity: [';
        const rActivity = collection.data()!['retailActivity'];
        rActivity.forEach((activity: ThirdPartyInteractionResult ) => {
          const marketContext = activity['context'];
          returnString += '{ \n ' +
              + 'power: ' + activity['power'] + ', \n'
              + 'volume: ' + activity['volume'] + ', \n'
              + 'context: {\n '
              + 'amountTokens: ' + marketContext['amountTokens'] + ',\n'
              + 't: ' + marketContext['t'] + '\n}'
              + '\n},';
        });
        if(rActivity.size > 0) {
          returnString = returnString.substring(0, returnString.length - 1);
        }
        returnString += '\n],\n';
        resolve(returnString + '\n]');
      });
    });
  }

  schedulingData(): Promise<string> {
    console.log('in scheduling');
    return new Promise(resolve => {
      this.db.collection('experimentResults-isolation').doc('prosumer scheduling data for prosumer with id ' + this.prosumerID).get().subscribe(collection => {
        console.log('db resolved');
        const schedulingDataPoints = new Array<AssetSchedulingDataPoint>();
        let returnString = '\n[';
        const rawDatapoints = collection.data()!['schedulingDataPoints'];
        rawDatapoints.forEach((currentData: AssetSchedulingDataPoint ) => {
          const rawContext = currentData['context'];
          returnString += '{ \n asset: ' + currentData['asset'] + ', \n scheduledTimeStep: ' + currentData['asset']  + ', \n plannedDispatchValue: ' + currentData['plannedDispatchValue'] + ',\n context: {\nschedulingIndex: ' + rawContext['schedulingIndex'] + ',\n' + ' t: ' + rawContext['t'] + '\n}\n,';
          schedulingDataPoints.push(new AssetSchedulingDataPoint(
              currentData['asset'], currentData['scheduledTimeStep'], currentData['plannedDispatchValue'],
              {
                schedulingIndex: rawContext['schedulingIndex'],
                t: rawContext['t']
              }
          ));
        });
        console.log('return string prepared');
        returnString = returnString.substring(0, returnString.length - 1);
        resolve(returnString + ']');
      });
    });
  }

  public saveFile(){
    const documentPromises: Array<Promise<string>> = new Array<Promise<string>>();
    const dlink: HTMLAnchorElement = document.createElement('a');
    dlink.download = 'experimentRecord.json'; // the file name
    let fileContent = '{ ';
    const prosumerDataPromise = this.getProsumerData();
    prosumerDataPromise.then(prosumerData => {
      fileContent += prosumerData + ',';
    });
    documentPromises.push(prosumerDataPromise);
    const marketDataPromise = this.getMarketData();
    marketDataPromise.then(marketData => {
      fileContent += marketData + ',';
    });
    documentPromises.push(marketDataPromise);
    const schedulingDataPromise = this.schedulingData();
    schedulingDataPromise.then(schedulingData => {
      fileContent += schedulingData;
    });
    documentPromises.push(schedulingDataPromise);
    Promise.all(documentPromises).then(promises => {
      console.log('promises resolved');
      fileContent += '\n}';
      dlink.href = 'data:text/plain;charset=utf-16,' + fileContent;
      dlink.click(); // this will trigger the dialog window
      dlink.remove();
    });
  }
}
