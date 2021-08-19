import { Injectable } from '@angular/core';
import {BlockchainInterface} from "../data-types/interfaces";
import {BehaviorSubject, Subject} from "rxjs";
import {P2POption} from "../data-types/P2POption";
import {AngularFirestore} from "@angular/fire/firestore";
import {SessionDataService} from "../session-data.service";
import {FirestoreLoggerService} from "./firestore-logger.service";
import {ProsumerInstance} from "../data-types/ProsumerInstance";

@Injectable({
  providedIn: 'root'
})
export class MockBlockchainService implements BlockchainInterface{
  private askCollection;
  private bidCollection;
  /** Variable to track the bids that an other actor committed to */
  private committedBids: P2POption[] = [];
  /** Variable to track the asks that an other actor committed to */
  private committedAsks: P2POption[] = [];
  /** Variable to track the bids no actor committed to yet */
  private openBids: P2POption[] = [];
  private openBidIndex: Set<string> = new Set<string>();
  private committedBidIndex: Set<string> = new Set<string>();
  /** Variable to track the asks no actor committed to yet */
  private openAsks: P2POption[] = [];
  private openAskIndex: Set<string> = new Set<string>();
  private committedAskIndex: Set<string> = new Set<string>();
  committedAskSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  committedBidSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  relevantOpenAsksSubject: Subject<P2POption[]> = new BehaviorSubject<P2POption[]>([]);
  relevantOpenBidsSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  unconfirmedAskCommits: Set<P2POption> = new Set<P2POption>();
  unconfirmedBidCommits: Set<P2POption> = new Set<P2POption>();
  // private optionConverter = {
  //   toFirestore: function(option) {
  //     return {
  //       optionCreator: option.optionCreator.respectiveProsumer.id,
  //       deliveryTime: option.deliveryTime,
  //       duration: option.duration,
  //       price: option.price,
  //       power: option.power,
  //       acceptedParty: option.acceptedParty.respectiveProsumer.id
  //     }
  //   },
  //   fromFirestore: function(snapshot, options){
  //     const option = snapshot.data(options);
  //     return {
  //       optionCreator: option.optionCreator,
  //       deliveryTime: option.deliveryTime,
  //       duration: option.duration,
  //       price: option.price,
  //       power: option.power,
  //       acceptedParty: option.acceptedParty
  //     }
  //   }
  //}

  constructor(private db: AngularFirestore,
              private session: SessionDataService,
              private logger: FirestoreLoggerService) {
    this.session.experimentInstanceEmitter.subscribe(experimentInstance => {
      this.askCollection = db.collection('experimentInstances').doc(this.session.experimentInstance.experimentID.toString()).collection('Asks');
      this.bidCollection = db.collection('experimentInstances').doc(this.session.experimentInstance.experimentID.toString()).collection('Bids');
      const experimentDoc = db.collection('experimentInstances').doc(this.session.experimentInstance.experimentID.toString());
      //TODO adapt analogously to the bids below when tested
      //Fetch & update Asks
      experimentDoc.collection('Asks').snapshotChanges().subscribe(changes => {
        experimentDoc.collection('Asks').get().subscribe(allAsks => {
          allAsks.forEach(currentAsk => {
            //if Asks are in the committed Asks, everything has already been processed; only interesting case where not
            if(!this.committedAskIndex.has(currentAsk.id)) {
              //if they have an acceptedParty despite not being in the set of committed ones, they need to be moved
              if (currentAsk.data()['acceptedParty']) {
                this.committedAsks.push({
                  id: currentAsk.id,
                  optionCreator: this.deriveProsumer(currentAsk.data()['optionCreator']),
                  deliveryTime: currentAsk.data()['deliveryTime'],
                  duration: currentAsk.data()['duration'],
                  price: currentAsk.data()['price'],
                  power: currentAsk.data()['power'],
                  acceptedParty: this.deriveProsumer(currentAsk.data()['acceptedParty']).respectiveProsumer.id
                });
                this.openAskIndex.delete(currentAsk.id);
                this.committedAskIndex.add(currentAsk.id);
                //remove from open Asks
                for(let i = 0; i < this.openAsks.length; i++) {
                  if (this.openAsks[i].id === currentAsk.id) {
                    this.openAsks.splice(i, 1);
                    break;
                  }
                }
              } else if (!this.openAskIndex.has(currentAsk.id)) {
                //if they are not in the set of open ones, they are brand new and need to be added
                const convertedAsk: P2POption = this.createNewP2POption(currentAsk.data(), currentAsk.id);
                this.logger.offerPipelineLog(convertedAsk, 3);
                if (convertedAsk) {
                  //if Ask is committed, check if it is still in the open Asks (just discovered), else ignore
                  this.openAsks.push(convertedAsk);
                  this.openAskIndex.add(currentAsk.id);
                }
              }
            }
          });
          this.relevantOpenAsksSubject.next(this.openAsks);
          this.committedAskSubject.next(this.committedAsks);
        });
      });
      // openAskCollection.get().subscribe(currentOpenAsks => {
      //   this.logger.offerPipelineLog('currentOpenAsks fetched:', 2);
      //   this.logger.offerPipelineLog(currentOpenAsks, 2);
      //   currentOpenAsks.forEach(currentAsk => {
      //     const convertedAsk: P2POption = this.convertToP2POption(currentAsk.data(), currentAsk.id);
      //     this.logger.offerPipelineLog(convertedAsk, 3);
      //     if(convertedAsk) {
      //       this.openAsks.push(convertedAsk);
      //     }
      //   });
      //   this.relevantOpenAsksSubject.next(this.openAsks);
      // });
      //Fetch and update bids
      experimentDoc.collection('Bids').snapshotChanges().subscribe(changes => {
        experimentDoc.collection('Bids').get().subscribe(allBids => {
          allBids.forEach(currentBid => {
            //if bids are in the committed bids, everything has already been processed; only interesting case where not
            if(!this.committedBidIndex.has(currentBid.id)) {
              //if they have an acceptedParty despite not being in the set of committed ones, they need to be moved
              if (currentBid.data()['acceptedParty']) {
                this.committedBids.push({
                  id: currentBid.id,
                  optionCreator: this.deriveProsumer(currentBid.data()['optionCreator']),
                  deliveryTime: currentBid.data()['deliveryTime'],
                  duration: currentBid.data()['duration'],
                  price: currentBid.data()['price'],
                  power: currentBid.data()['power'],
                  acceptedParty: this.deriveProsumer(currentBid.data()['acceptedParty']).respectiveProsumer.id
                });
                this.openBidIndex.delete(currentBid.id);
                this.committedBidIndex.add(currentBid.id);
                //remove from open bids
                for(let i = 0; i < this.openBids.length; i++) {
                  if (this.openBids[i].id === currentBid.id) {
                    this.openBids.splice(i, 1);
                    break;
                  }
                }
              } else if (!this.openBidIndex.has(currentBid.id)) {
                //if they are not in the set of open ones, they are brand new and need to be added
                const convertedBid: P2POption = this.createNewP2POption(currentBid.data(), currentBid.id);
                this.logger.offerPipelineLog(convertedBid, 3);
                if (convertedBid) {
                  //if bid is committed, check if it is still in the open bids (just discovered), else ignore
                  this.openBids.push(convertedBid);
                  this.openBidIndex.add(currentBid.id);
                }
              }
            }
          });
          this.relevantOpenBidsSubject.next(this.openBids);
          this.committedBidSubject.next(this.committedBids);
        });
      });
    });
  }

  private createNewP2POption(snapshotData, id): P2POption {
    this.logger.offerPipelineLog('id of ask to convert: ' + id, 3);
    return {
      id: id,
      optionCreator: this.deriveProsumer(snapshotData['optionCreator']),
      deliveryTime: snapshotData['deliveryTime'],
      duration: snapshotData['duration'],
      price: snapshotData['price'],
      power: snapshotData['power'],
      acceptedParty: null
    }
  }

  private deriveProsumer(prosumerID: number): ProsumerInstance {
    let retrievedProsumer = null;
    this.session.experimentProsumers.forEach(currentProsumer => {
      if (currentProsumer.respectiveProsumer.id === prosumerID){
        retrievedProsumer = currentProsumer;
      }
    });
    if(!retrievedProsumer) {
      console.error('ERROR! Prosumer with id ' + prosumerID + ' could not be retrieved!!');
    }
    return retrievedProsumer;
  }

  commitToP2PAsk(committedAsk: P2POption): boolean {
    if(this.askCollection.doc(committedAsk.id).exists){
      if(this.askCollection.doc(committedAsk.id).get().acceptedParty){
        console.error('ERROR! Another party already took up this ask!');
        return false
      } else {
        this.askCollection.doc(committedAsk.id).update({
          acceptedParty: this.session.currentProsumer.respectiveProsumer.id
        });
        return true;
      }
    } else {
      console.error('ERROR: trying to commit to an ask that doesnt exist: ' + committedAsk.id );
      return false;
    }
  }

  commitToP2PBid(bidToCommitTo: P2POption): boolean {
    this.bidCollection.doc(bidToCommitTo.id).update({acceptedParty: this.session.currentProsumer.respectiveProsumer.id});
    return true;
  }

  getCommitedAsks(): P2POption[] {
    return this.committedAsks;
  }

  getCommitedBids(): P2POption[] {
    return this.committedBids;
  }

  getOpenAsks(): P2POption[] {
    return this.openAsks;
  }

  getOpenBids(): P2POption[] {
    return this.openBids;
  }

  submitAsk(ask: P2POption): boolean {
    console.log(ask.optionCreator);
    this.db.collection('experimentInstances').doc(this.session.experimentInstance.experimentID.toString()).collection('Asks').add({
      optionCreator: ask.optionCreator.respectiveProsumer.id,
      deliveryTime: ask.deliveryTime,
      duration: ask.duration,
      price: ask.price,
      power: ask.power,
      acceptedParty: null
    })
        .then(function(docRef) {
            console.log("Document written with ID: ", docRef.id);
          })
        .catch(function(error) {
            console.error("Error adding document: ", error);
        });
    return true;
  }

  submitBid(bid: P2POption): boolean {
    this.db.collection('experimentInstances').doc(this.session.experimentInstance.experimentID.toString()).collection('Bids').add({
      optionCreator: bid.optionCreator.respectiveProsumer.id,
      deliveryTime: bid.deliveryTime,
      duration: bid.duration,
      price: bid.price,
      power: bid.power,
      acceptedParty: null
    })
        .then(function(docRef) {
          console.log("Document written with ID: ", docRef.id);
        })
        .catch(function(error) {
          console.error("Error adding document: ", error);
        });
    return true;
  }
}
