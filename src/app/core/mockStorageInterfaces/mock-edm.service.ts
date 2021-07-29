import { Injectable } from '@angular/core';
import {EDMInterface} from "../data-types/interfaces";
import {ExperimentDescription} from "../data-types/ExperimentDescription";
import {ExperimentInstance} from "../data-types/ExperimentInstance";
import {ProsumerInstance} from "../data-types/ProsumerInstance";
import {AngularFirestore} from "@angular/fire/firestore";
import {ExperimentDescriptionProsumer} from "../data-types/ExperimentDescriptionProsumers";
import {Load} from "../data-types/Load";
import {ControllableGenerator} from "../data-types/ControllableGenerator";
import {NonControllableGenerator} from "../data-types/NonControllableGenerator";
import {StorageUnit} from "../data-types/StorageUnit";
import {Observable} from "rxjs";
import {firestore} from "firebase";
//import 'firebase/firestore'
import {FirestoreLoggerService} from "./firestore-logger.service";

@Injectable({
  providedIn: 'root'
})
/**
 * class to implement data provision as a fallback to the EDM layer.
 * Uses the firestore infrastructure to store and retrieve relevant data.
 * As an implementation of the EDMInterface, the class provides the same interface as the EDM connector
 */
export class MockEDMService implements EDMInterface {

    constructor(private db: AngularFirestore,
                private logger: FirestoreLoggerService) {
        console.log('mock edm service setup');
    }

    /**
     * Method to load an experiment description from the store based on the ID of the ExperimentDescription in question.
     * Aggregates the promises and executes the respective query and returns a promise that resolves in the queried experiment description
     * Description is retrieved from the respective experimentDescription collection in the database
     * @param id The id of the ExperimentDescription in question
     */
    loadExperimentDescription(id: string): Promise<ExperimentDescription> {
        return new Promise<ExperimentDescription>(resolve => {
            this.db.collection('experimentDescription').doc('experiment-' + id).get().subscribe(experimentDescription => {
                this.db.collection('experimentDescription').doc('experiment-' + id).collection('prosumerDescription').get().subscribe(prosumerDescriptions => {
                    this.logger.firestoreLoaderLog(prosumerDescriptions, 2);
                    //Array to collect all the promises for the prosumers that are individually queried from the db
                    const prosumerDescriptionPromises: Array<Promise<ExperimentDescriptionProsumer>> = new Array<Promise<ExperimentDescriptionProsumer>>();
                    prosumerDescriptions.forEach(prosumerDescription => {
                        //set up the promise for every prosumer and aggregate them in the array
                        prosumerDescriptionPromises.push(this.prepareProsumerPromise(prosumerDescription, id));
                        this.logger.firestoreLoaderLog('Adding prosumerDescription promise ' + prosumerDescription.id, 4);
                    });
                    //wait until all the individual promises are resolved (i.e. all the prosumer data is loaded) and resolve the promise of the full description
                    Promise.all(prosumerDescriptionPromises).then(prosumersResolved => {
                        this.logger.firestoreLoaderLog('all prosumer description promises resolve', 3);
                        this.logger.firestoreLoaderLog(prosumersResolved, 3);
                        console.log(experimentDescription.data());
                        resolve({
                            description: experimentDescription.data()['description'],
                            experimentLength: experimentDescription.data()['experimentLength'],
                            id: experimentDescription.data()['id'],
                            p2pMarketDesign: experimentDescription.data()['p2pMarketDesign'],
                            prosumers: prosumersResolved,
                            feedInTariff: experimentDescription.data()['feedInTariff'],
                            retailPrice: experimentDescription.data()['retailPrice'],
                            inbalancePenalty: experimentDescription.data()['inbalancePenalty']
                        });
                        this.logger.firestoreLoaderLog('returned promise of ED loader resolved', 3);
                    });
                });
            });
        });
    }

    /**
     * Helper function to compose the promise for an individual ExperimentDescriptionProsumer.
     * Queries the assets by asset type and waits until all queries are resolved in order to construct the respective description.
     * Assets are retrieved by individual queries, while other data is taken from the query result given in the parameter
     *
     * @param prosumerQueryResult The firestore query result for the individual prosumer to be queried
     * @param id The id of the experiment the prosumer description is associated with
     * @private
     */
    private prepareProsumerPromise(prosumerQueryResult, id: string): Promise<ExperimentDescriptionProsumer> {
        this.logger.firestoreLoaderLog('preparing the prosumer promise ' + id, 4);
        return new Promise<ExperimentDescriptionProsumer>(resolve => {
            //set up the data structures containing the assets and the promises for the respective asset sets
            const loads: Array<Load> = new Array<Load>();
            const controllableGenerators: Array<ControllableGenerator> = new Array<ControllableGenerator>();
            const nonControllableGenerators: Array<NonControllableGenerator> = new Array<NonControllableGenerator>();
            const storageUnits: Array<StorageUnit> = new Array<StorageUnit>();
            const assetPromises: Array<Observable<firestore.QuerySnapshot>> = new Array<Observable<firestore.QuerySnapshot>>();
            //prepare the promise/snapshot for the load assets and specify how the loads are created in the data structure
            const loadSnapshot = this.db.collection('experimentDescription').doc('experiment-' + id).collection('prosumerDescription').doc(prosumerQueryResult.id).collection('loads').get();
            this.logger.firestoreLoaderLog('loadSnapshot acquired', 5);
            loadSnapshot.subscribe(loadResolve => {
                this.logger.firestoreLoaderLog('load resolved', 5);
                loadResolve.forEach(currentLoadDocument => {
                    this.logger.firestoreLoaderLog('load that was resolved: ', 5);
                    this.logger.firestoreLoaderLog(currentLoadDocument, 5);
                    loads.push(new Load(
                        currentLoadDocument.data()['model'],
                        currentLoadDocument.data()['relativeControllability'],
                        currentLoadDocument.data()['temporalShiftingCapability'],
                        currentLoadDocument.data()['loadCurve']
                    ));
                });
            });
            //adding the load promise to the set of promises that need to be evaluated in order to resolve the promise returned by this function
            assetPromises.push(loadSnapshot);
            //prepare the promise/snapshot for the controllable generators assets and specify how the CGs are created in the data structure
            const controllableGeneratorsSnapshot = this.db.collection('experimentDescription').doc('experiment-' + id).collection('prosumerDescription').doc(prosumerQueryResult.id).collection('controllableGenerators').get();
            this.logger.firestoreLoaderLog('cgSnapshot acquired', 5);
            controllableGeneratorsSnapshot.subscribe(cgResolve => {
                this.logger.firestoreLoaderLog(cgResolve, 5);
                cgResolve.forEach(currentCGDocument => {
                    this.logger.firestoreLoaderLog(currentCGDocument, 5);
                    controllableGenerators.push(new ControllableGenerator(
                        currentCGDocument.data()['model'],
                        currentCGDocument.data()['maximalGeneration'],
                        currentCGDocument.data()['minimalDowntime'],
                        currentCGDocument.data()['minimalUptime'],
                        currentCGDocument.data()['rampingParameter']
                    ));
                });
            });
            //adding the CG promise to the set of promises that need to be evaluated in order to resolve the promise returned by this function
            assetPromises.push(controllableGeneratorsSnapshot);
            //prepare the promise/snapshot for the non-controllable generators assets and specify how the NCGs are created in the data structure
            const nonCGSnapshot = this.db.collection('experimentDescription').doc('experiment-' + id).collection('prosumerDescription').doc(prosumerQueryResult.id).collection('nonControllableGenerators').get();
            this.logger.firestoreLoaderLog('noncgSnapshot acquired', 5);
            nonCGSnapshot.subscribe(nCGResolve => {
                this.logger.firestoreLoaderLog(nCGResolve, 5);
                nCGResolve.forEach(currentNCGDocument => {
                    this.logger.firestoreLoaderLog(currentNCGDocument, 5);
                    nonControllableGenerators.push(new NonControllableGenerator(
                        currentNCGDocument.data()['model'],
                        currentNCGDocument.data()['peakPower'],
                        currentNCGDocument.data()['generationCurve']
                    ));
                });
            });
            //adding the nCG promise to the set of promises that need to be evaluated in order to resolve the promise returned by this function
            assetPromises.push(nonCGSnapshot);
            //prepare the promise/snapshot for the storage assets and specify how the storages are created in the data structure
            const storageSnapshot = this.db.collection('experimentDescription').doc('experiment-' + id).collection('prosumerDescription').doc(prosumerQueryResult.id).collection('storages').get();
            this.logger.firestoreLoaderLog('storage snap acquired', 5);
            storageSnapshot.subscribe(storageResolve => {
                this.logger.firestoreLoaderLog(storageResolve, 5);
                storageResolve.forEach(currentStorageDocument => {
                    this.logger.firestoreLoaderLog(currentStorageDocument, 5);
                    storageUnits.push(new StorageUnit(
                        currentStorageDocument.data()['model'],
                        currentStorageDocument.data()['storageCapacity'],
                        currentStorageDocument.data()['feedinPower'],
                        currentStorageDocument.data()['feedoutPower'],
                        currentStorageDocument.data()['cycleEfficiency'],
                        currentStorageDocument.data()['initialSOC']
                    ));
                });
            });
            //adding the storage promise to the set of promises that need to be evaluated in order to resolve the promise returned by this function
            assetPromises.push(storageSnapshot);
            this.logger.firestoreLoaderLog('asset promises prepared; waiting for the promises to resolve', 3);
            //wait until all asset promises have resolved before preparing the experiment description prosumer object used in the promise resolution of the returned promise
            Promise.all(assetPromises).then(promiseResolution => {
                this.logger.firestoreLoaderLog('all asset promises resolved', 3);
                this.logger.firestoreLoaderLog(promiseResolution, 3);
                //create the respective data structure
                const prosumerDescription: ExperimentDescriptionProsumer = {
                    id: prosumerQueryResult.data()['id'],
                    name: prosumerQueryResult.data()['name'],
                    startTokens: prosumerQueryResult.data()['startTokens'],
                    coordinates: {
                        x: prosumerQueryResult.data()['coordinates']['x'],
                        y: prosumerQueryResult.data()['coordinates']['y']
                    },
                    assets: {
                        loads: loads,
                        controllableGenerators: controllableGenerators,
                        nonControllableGenerators: nonControllableGenerators,
                        storageUnits: storageUnits
                    }
                }
                this.logger.firestoreLoaderLog(prosumerDescription, 3);
                //ready to resolve after everything else is resolved and prepared
                resolve(prosumerDescription);
            });
        });
    }

    /**
     * Method to load the instance of a specified experiment from the store.
     * @param id ID of the experiment instance
     * @param respectiveExperiment the experiment description the instance belongs to
     */
    loadExperimentInstance(id: string, respectiveExperiment: ExperimentDescription): Promise<ExperimentInstance> {
        return new Promise<ExperimentInstance>(resolve => {
            this.db.collection('experimentDescription').doc('experiment-' + respectiveExperiment.id).collection('experiment-instance-' + id).get().subscribe(experimentInstance => {
                if(experimentInstance.docs.length > 0){
                    resolve({
                        experimentID: Number.parseInt(id),
                        instanceOfExperiment: respectiveExperiment,
                        tickLength: Number.parseInt(experimentInstance.docs[0].data()['tickLength'])
                    });
                    //TODO if experiment instance doesn't exist, resort to default
                } else {
                    resolve({
                        experimentID: Number.parseInt(id),
                        instanceOfExperiment: respectiveExperiment,
                        tickLength: 1
                    });
                }
            });
        });
    }

    //TODO implement when experiment data specification is coordinated
    recordData(experimentInstance: ExperimentInstance, prosumerInstance: ProsumerInstance) {
    }

    //TODO irrelevant with the mock interface
    storeData(distributionString: string, datasetString: string, objectToStore: object) {
        console.log(objectToStore);
        this.db.collection('experimentResults-test').doc(distributionString).set(objectToStore);
    }

    /**
     * Method to store the description of an experiment in the store
     * @param experiment The experimentDescription object used in the laboratory
     */
    storeExperimentDescription(experiment: ExperimentDescription) {
        // const experimentDescription = {
        //   prosumers: experiment.prosumers.map(currentProsumerDescription => this.castProsumerDescription(currentProsumerDescription)),
        //   p2pMarketDesign: {
        //     bidClosure: experiment.p2pMarketDesign.bidClosure,
        //     askClosure: experiment.p2pMarketDesign.askClosure,
        //     timeSliceLength: experiment.p2pMarketDesign.timeSliceLength,
        //     minBidSize: experiment.p2pMarketDesign.minBidSize,
        //     minAskSize: experiment.p2pMarketDesign.minAskSize,
        //     maxPrice: experiment.p2pMarketDesign.maxPrice,
        //     feeAmount: experiment.p2pMarketDesign.feeAmount
        //   },
        //   description: experiment.description,
        //   experimentLength: experiment.experimentLength,
        //   id: experiment.id
        // }
        // this.logger.firestoreLoaderLog(experimentDescription, 3);
        //set the respective non-prosumer-related stuff for the experiment description
        this.db.collection('experimentDescription').doc('experiment-' + experiment.id).set({
            p2pMarketDesign: {
                bidClosure: experiment.p2pMarketDesign.bidClosure,
                askClosure: experiment.p2pMarketDesign.askClosure,
                timeSliceLength: experiment.p2pMarketDesign.timeSliceLength,
                minBidSize: experiment.p2pMarketDesign.minBidSize,
                minAskSize: experiment.p2pMarketDesign.minAskSize,
                maxPrice: experiment.p2pMarketDesign.maxPrice,
                feeAmount: experiment.p2pMarketDesign.feeAmount
            },
            description: experiment.description,
            experimentLength: experiment.experimentLength,
            id: experiment.id,
            feedInTariff: experiment.feedInTariff,
            retailPrice: experiment.retailPrice,
            inbalancePenalty: experiment.inbalancePenalty
        }).then(() => {
            //add the prosumer description data for each prosumer when experiment description is set up in order to have the right document available
            experiment.prosumers.forEach(currentProsumerDescription => {
                //set up the basic data within the prosumerDescription collection of the store
                this.db.collection('experimentDescription').doc('experiment-' + experiment.id).collection('prosumerDescription').add({
                    id: currentProsumerDescription.id,
                    name: currentProsumerDescription.name,
                    coordinates: {
                        x: currentProsumerDescription.coordinates.x,
                        y: currentProsumerDescription.coordinates.y
                    },
                    startTokens: currentProsumerDescription.startTokens
                }).then(ref => {
                    this.logger.firestoreLoaderLog(ref, 4);
                    //add the collections for the respective assets to the document corresponding to the prosumer in the respective prosumerDescription collection
                    currentProsumerDescription.assets.loads.forEach(currentLoad => {
                        this.db.collection('experimentDescription').doc('experiment-' + experiment.id).collection('prosumerDescription').doc(ref.id).collection('loads').add(this.castLoad(currentLoad));
                    });
                    currentProsumerDescription.assets.controllableGenerators.forEach(controllableGenerator => {
                        this.db.collection('experimentDescription').doc('experiment-' + experiment.id).collection('prosumerDescription').doc(ref.id).collection('controllableGenerators').add(this.castCG(controllableGenerator));
                    });
                    currentProsumerDescription.assets.nonControllableGenerators.forEach(nonControllableGenerator => {
                        this.db.collection('experimentDescription').doc('experiment-' + experiment.id).collection('prosumerDescription').doc(ref.id).collection('nonControllableGenerators').add(this.castNCG(nonControllableGenerator));
                    });
                    currentProsumerDescription.assets.storageUnits.forEach(currentStorage => {
                        this.db.collection('experimentDescription').doc('experiment-' + experiment.id).collection('prosumerDescription').doc(ref.id).collection('storages').add(this.castStorage(currentStorage));
                    });
                });
                //.map(currentProsumerDescription => this.castProsumerDescription(currentProsumerDescription)),
            });
        });
    }

    /**
     * Method to store an instance of an experiment as a collection within the experiment document
     */
    storeExperimentInstance(instanceOf: ExperimentDescription, tickLength: number, instanceID: number) {
        this.db.collection('experimentDescription').doc('experiment-' + instanceOf.id).collection('experiment-instance-' + instanceID.toString()).add({
            tickLength: tickLength
        });
    }

    /**
     * Helper method that transforms the custom storageUnit object into a generic object to please firebase
     * @param currentStorage
     * @private
     */
    private castStorage(currentStorage: StorageUnit) {
        return {
            model: currentStorage.model,
            storageCapacity: currentStorage.storageCapacity,
            feedinPower: currentStorage.feedinPower,
            feedoutPower: currentStorage.feedoutPower,
            cycleEfficiency: currentStorage.cycleEfficiency,
            initialSOC: currentStorage.initialSOC
        }
    }

    /**
     * Helper method that transforms the custom NCG object into a generic object to please firebase
     * @param currentStorage
     * @private
     */
    private castNCG(currentNCG: NonControllableGenerator) {
        return {
            model: currentNCG.model,
            peakPower: currentNCG.peakPower,
            generationCurve: currentNCG.generationCurve
        }
    }

    /**
     * Helper method that transforms the custom CG object into a generic object to please firebase
     * @param currentStorage
     * @private
     */
    private castCG(currentCG: ControllableGenerator) {
        return {
            model: currentCG.model,
            maximalGeneration: currentCG.maximalGeneration,
            minimalDowntime: currentCG.minimalDowntime,
            minimalUptime: currentCG.minimalUptime,
            rampingParameter: currentCG.ramping
        }
    }

    /**
     * Helper method that transforms the custom Load object into a generic object to please firebase
     * @param currentStorage
     * @private
     */
    private castLoad(currentLoad: Load) {
        return {
            model: currentLoad.model,
            relativeControllability: currentLoad.relativeControllability,
            temporalShiftingCapability: currentLoad.temporalShiftingCapability,
            loadCurve: currentLoad.loadCurve
        }
    }
}
