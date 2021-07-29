import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';
import {BlockchainParticipant, BlockchainResource} from '../data-types/response-types/BlockchainResource';
import {HttpClient} from '@angular/common/http';
import {BlockchainLoggerService} from './blockchain-logger.service';
import {SessionDataService} from "../session-data.service";
import {TimeService} from "../time.service";
import {BlockchainHelperService} from "./blockchain-helper.service";

@Injectable({
  providedIn: 'root'
})
/**
 * The resourceWatcherService serves to periodically request resources from the API connected to the blockchain.
 * It allows listeners to get a periodic snapshot of all resources that are mined in transactions on the chain.
 * It emits these resources through the resourceStream, which notifies subscribers of the current resources state on the chain.
 */
export class ResourceWatcherService {
  //Stream to emit all resources observed on the blockchain to interested parties
  public resourceStream: Subject<Set<BlockchainResource>> = new Subject<Set<BlockchainResource>>();
  constructor(private http: HttpClient,
              private session: SessionDataService,
              private logger: BlockchainLoggerService,
              private timeService: TimeService,
              private blockchain: BlockchainHelperService) {
    //initiate the watch cycle to periodically poll the blockchain for updates on the resources used.
    if (this.session.blockchainToken) {
      this.watchCycle();
    } else {
      this.session.tokenEmitter.subscribe(token => {
        this.watchCycle();
      });
    }
  }

  /**
   * Function for continuously polling the blockchain for resources in use.
   * Sends a casted version of the resources found through the resourceStream
   * and schedules repeated execution based on the watcherInterval
   */
  private watchCycle(): void{
    if (this.session.blockchainToken){
      this.http.get(this.blockchain.chainApi + '/registry/resource', {observe: 'body', responseType: 'json'}).subscribe(resourcesResult => {
        this.logger.resourceManagerLog('Sending resources from resource watch cycle', 3);
        this.resourceStream.next(this.castResources(resourcesResult));
      });
    } else {
      this.logger.watcherLog("Skipping a watch cycle since token is not set yet", 2);
    }
    setTimeout(() => {this.watchCycle()}, this.timeService.watcherInterval);
  }

  /**
   * Function to cast the resources retrieved from the blockchain as an API return object into the format specified by a BlockchainResource.
   * Resources in the API return data are characterized by an resourceType, resourceID and owner field, which corresponds to a BlockchainParticipant
   * @param queryResult The return object of the API call
   * @return The resources observed on the blockchain in the form of BlockchainResource objects
   */
  private castResources(queryResult): Set<BlockchainResource>{
    this.logger.watcherLog("trying to convert query result: " + queryResult, 3);
    const resources: Set<BlockchainResource> = new Set<BlockchainResource>();
    if (queryResult.hasOwnProperty("resources")){
      try{
        queryResult["resources"].forEach(currentResource => {
          if (currentResource.hasOwnProperty("owner")) {
            const rawOwner = currentResource["owner"];
            const resourceOwner: BlockchainParticipant = {
              createdAt: rawOwner["createdAt"],
              email: rawOwner["email"],
              ethereumAddress: rawOwner["ethereumAddress"],
              firstName: rawOwner["firstName"],
              id: parseInt(rawOwner["id"]),
              lastName: rawOwner["lastName"],
              picture: rawOwner["picture"]
            };
            resources.add({
              owner: resourceOwner,
              resourceID: currentResource["resourceID"],
              resourceType: currentResource["resourceType"]
            });
          } else {
            resources.add({
              owner: null,
              resourceID: currentResource["resourceID"],
              resourceType: currentResource["resourceType"]
            });
          }
        });
        return resources;
      } catch (e) {
        console.error(e);
      }
    } else {
      console.error("Resources not in the key of the query result!!");
      return null;
    }
  }
}
