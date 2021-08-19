import { Injectable } from '@angular/core';
import { ResourceWatcherService } from './resource-watcher.service';
import { BlockchainResource } from '../data-types/response-types/BlockchainResource';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { BlockchainLoggerService } from './blockchain-logger.service';
import { HelperService } from '../../shared/helper.service';
import { BlockchainOfferProcessorService } from './blockchain-offer-processor.service';
import { BlockchainHelperService } from "./blockchain-helper.service";
import { SessionDataService } from "../session-data.service";
import { PoolSizes } from "../data-types/PoolSizes";

@Injectable({
  providedIn: 'root'
})
/**
 * The resource manager service serves to manage the participant-specific pool of resources used in the experiment.
 * It manages three resource pools: the available, pending and inUse pool that can be drawn from for information.
 * The pool of available resources can be drawn from to associate (a) new transaction(s) with.
 * If a resource is drawn from the available pool, it is removed, and as soon as the resource is used with offers it is put in the inUse pool.
 * The pending pool is used for the creation of new resources.
 * When a resource is taken from the available pool, they are replenished by the creation of new resources, which will start out in the pending pool.
 * They are moved from the pending pool into the available pool once the transaction has been mined on the blockchain.
 * The pools use the resourceID as an index, which is mapped to the corresponding resources through the resourceIndex.
 */
export class ResourceManagerService {
  //sets to manage the (IDs of the) resources in the respective pools
  private availableResourcesPool: Set<string> = new Set<string>();
  private pendingResourcesPool: Set<string> = new Set<string>();
  private inUseResourcesPool: Set<string> = new Set<string>();
  //Dictionary to map the resource IDs to the respective objects
  public resourceIndex: Map<string, BlockchainResource> = new Map<string, BlockchainResource>();
  //stream to broadcast newly found availabilities for resolving resource request promises
  private availableResourceStream: Subject<Set<string>> = new Subject<Set<string>>();
  //update for resource pool sizes and respective changes
  public poolEmitter: Subject<PoolSizes> = new Subject<PoolSizes>();
  //resource counter to keep track of resource indices already in use (all partial IDs above this are considered free)
  private freeResourceIndex = 0;
  public poolSizes: PoolSizes = new PoolSizes(0,0,0);
  /**
   * On initialization of the service, it subscribes to the watcher services (or respective service in the watcher pipeline).
   * It furthermore generates the initial set of resources (requesting their creation) and engages in miscellaneous setup tasks.
   *
   * @param resourceUpdateService A service that contains the resource stream (that yields all resources registered on the blockchain).
   * @param offerProcessor A service for processing offers that contains the resourceInUseStream yielding all resources bound to offers on the chain.
   */
  constructor(private resourceUpdateService: ResourceWatcherService,
              private http: HttpClient,
              private blockchain: BlockchainHelperService,
              private session: SessionDataService,
              private logger: BlockchainLoggerService,
              private offerProcessor: BlockchainOfferProcessorService) {
    /** setup listener for the current set of resources on the blockchain;
     * resources found in this stream belonging to the respective experiment are either available (not bound to offers) or in use (bound to offers)
     * Available resources might be in the pool of available or pending resources;
     * for the latter, they are moved to the available pool, so they can be requested / open requests resolved
    */
    //Create an initial set of resources
    this.createNResources(blockchain.optimalResourcePoolSize);
    //Manage resources found on the blockchain
    this.resourceUpdateService.resourceStream.subscribe(currentResources => {
      // check resources used in this experiment
      currentResources.forEach(currentResource => {
        this.logger.resourceManagerLog(currentResource.toString(), 4);
        //Filter out those resources not used in the experiment by this prosumer (that are not of the type experimentID-instanceID-prosumerID)
        if (currentResource.resourceType === (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id)) {
          //check for resources that are in neither pool in order to detect errors in managing pools
          if (!this.pendingResourcesPool.has(currentResource.resourceID) && !this.availableResourcesPool.has(currentResource.resourceID) && !this.inUseResourcesPool.has(currentResource.resourceID)) {
            console.error('Anomaly detected!! Resource ' + currentResource.resourceID + ' is in no pool. Error, error!!');
            console.error('Maybe the transaction in use is still pending or the time frame causes it to not have been registered in the inUse pool');
          }
          //As resources observed here are confirmed on the blockchain, they are no longer pending and have to be moved to the available pool
          if (this.pendingResourcesPool.has(currentResource.resourceID)) {
            this.logger.resourceManagerLog('resource ' + currentResource.resourceID + ' was found in pending, but is now retrieved, is moved to available', 3);
            this.pendingResourcesPool.delete(currentResource.resourceID);
            this.availableResourcesPool.add(currentResource.resourceID);
            this.resourceIndex.set(currentResource.resourceID, currentResource);
            this.emitResourcePool();
            this.availableResourceStream.next(this.availableResourcesPool);
          }
        }
      });
    });
    // Reaction to updated list of resources used in transactions of the user (only subset!)
    this.offerProcessor.resourceInUseStream.subscribe(resourceIDsInUse => {
      //identify resources not used in transactions and move them to the inUse pool (make them become unavailable)
      const missingElements = HelperService.difference(resourceIDsInUse, this.inUseResourcesPool);
      missingElements.forEach(currentMissingElement => {
        if (this.availableResourcesPool.has(currentMissingElement)){
          console.error('Resource ' + currentMissingElement + ' found in available pool although it should be in the inuse pool');
          this.availableResourcesPool.delete(currentMissingElement);
          this.inUseResourcesPool.add(currentMissingElement);
          this.emitResourcePool();
          //check if a new resource needs to be created (if the pool is non-optimal)
          if (this.availableResourcesPool.size < blockchain.optimalResourcePoolSize){
            this.createNResources(1);
          }
        } else {
          this.inUseResourcesPool.add(currentMissingElement);
          this.emitResourcePool();
        }
      });
    });
    this.poolEmitterCycle();
  }

  private poolEmitterCycle(){
    this.emitResourcePool();
    setTimeout(() => {this.poolEmitterCycle()}, 5000);
  }

  public resourceAvailable(): boolean {
    return (this.availableResourcesPool.size > 0);
  }

  /**
   * Function to provide unused resources. If no such resource exists it will be created.
   * As the state is uncertain, a promise is returned which is resolved either immediately or as soon as said resource becomes available
   * Further tries to fill up the pool of resources if necessary.
   * WARNING: if requested multiple times with an empty available pool, distinct promises might resolve to the same resource!!
   * @return Promise resolving to a resource that has not been used on the blockchain yet as soon as possible
   */
  public requestFreeResourcePromise(): Promise<BlockchainResource> {
    this.logger.resourceManagerLog('free resource promise requested', 3);
    //If an availble resource exists, resolve promise immediately upon returning
    if (this.availableResourcesPool.size > 0){
      // Potentially wasteful, yielding unsued resources that are never retrieved, but not anticipated to be performance-critical
      const chosenResourceID: string = this.availableResourcesPool.values().next().value;
      this.logger.resourceManagerLog('About to delete resource ' + chosenResourceID + ' from available pool as it has been requested as a free resource', 3);
      this.availableResourcesPool.delete(chosenResourceID);
      this.inUseResourcesPool.add(chosenResourceID);
      this.emitResourcePool();
      //If necessary, contribute to fill up the pool
      if (this.availableResourcesPool.size < this.blockchain.optimalResourcePoolSize){
        this.createNResources(this.blockchain.optimalResourcePoolSize - this.availableResourcesPool.size);
      }
      return new Promise<BlockchainResource>((resolve, reject) => {
        const respectiveResource: BlockchainResource = this.resourceIndex.get(chosenResourceID)!;
        resolve(respectiveResource);
      });
    } else {
      //if no resource available, resolve promise as soon as an available resource becomes available
      this.createNResources(this.blockchain.optimalResourcePoolSize);
      return new Promise<BlockchainResource>((resolve, reject) => {
        this.availableResourceStream.subscribe(availableResources => {
          this.logger.resourceManagerLog('available resources have changed to a number of ' + availableResources.size, 2);
          const returnResourceID: string = availableResources.keys().next().value;
          const respectiveResource: BlockchainResource = this.resourceIndex.get(returnResourceID)!;
          this.logger.resourceManagerLog('resource ' + returnResourceID + ' is becoming unavailable as it was retrieved', 2);
          this.logger.resourceManagerLog('About to delete resource ' + returnResourceID + ' from available pool as it has been requested as a free resource (asynchronously)', 2);
          this.availableResourcesPool.delete(returnResourceID);
          this.inUseResourcesPool.add(returnResourceID);
          this.emitResourcePool();
          resolve(respectiveResource);
        });
      });
    }
  }

  /**
   * Helper function to generate a given number of resources (issue the request to the blockchain).
   * Resources are created as pending and can be used when observed by the resource watcher.
   * resource type is specific to the experiment design, instance and prosumer, and their ids compounds this with a unique identifier (ids of respective components are name elements separated by hyphens)
   *
   * @param numberOfResourcesToCreate The number of resources to request creation towards the API for
   */
  private createNResources(numberOfResourcesToCreate: number): void {
    if (this.session.blockchainToken){
      //Generate a number of resources with an ID comprising the experiment description, instance, prosumer and a unique ID (separated by hypens)
      for (let i = 0; i < numberOfResourcesToCreate; i++){
        const currentID = (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id + '-' + (this.freeResourceIndex + i));
        this.logger.resourceManagerLog("Trying to create resource " + currentID + ' of type ' +  (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id), 2);
        this.http.post(this.blockchain.chainApi + '/registry/resource', {
          resourceID: currentID,
          resourceType: (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id)
        }).subscribe(response => {
          this.logger.resourceManagerLog(response.toString(), 3);
        });
        this.logger.resourceManagerLog('Adding resource ' + currentID + ' to the pending pool', 3);
        //Marking created resources / requests as pending to associate them with a pool
        this.pendingResourcesPool.add(currentID);
        this.emitResourcePool();
      }
      this.freeResourceIndex += numberOfResourcesToCreate;
    } else {
      this.session.tokenEmitter.subscribe(token => {
        for (let i = 0; i < numberOfResourcesToCreate; i++){
          const currentID = (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id + '-' + (this.freeResourceIndex + i));
          this.logger.resourceManagerLog("Trying to create resource " + currentID, 3);
          this.http.post(this.blockchain.chainApi + '/registry/resource', {
            resourceID: currentID,
            resourceType: (this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + this.session.currentProsumer.respectiveProsumer.id)
          }).subscribe(response => {
            this.logger.resourceManagerLog(response.toString(), 3);
          });
          this.logger.resourceManagerLog('Adding resource + ' + currentID + ' to the pending pool', 3);
          this.pendingResourcesPool.add(currentID);
          this.emitResourcePool();
        }
        this.freeResourceIndex += numberOfResourcesToCreate;
      });
    }
  }

  /**
   * Function to emit an object with the three pool sizes to all subscribers.
   * Serves to propagate current pool size for information purposes.
   */
  private emitResourcePool(): void {
    this.poolSizes.pending = this.pendingResourcesPool.size;
    this.poolSizes.available = this.availableResourcesPool.size;
    this.poolSizes.inUse = this.inUseResourcesPool.size;
    this.poolEmitter.next(this.poolSizes);
  }
}
