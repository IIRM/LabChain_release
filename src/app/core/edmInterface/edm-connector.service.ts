import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ExperimentDescription} from '../data-types/ExperimentDescription';
import {ProsumerInstance} from '../data-types/ProsumerInstance';
import {ExperimentDescriptionProsumer} from '../data-types/ExperimentDescriptionProsumers';
import {ExperimentInstance} from '../data-types/ExperimentInstance';
import {EDMHelperService} from "./edmhelper.service";
import {EDMInterface} from "../data-types/interfaces";

@Injectable({
  providedIn: 'root'
})
/**
 * Class to provide interface functionality to the EDM.
 * Allows for token retrieval as well as loading and storing data to the platform.
 * Makes use of the EDM helper for managing static data and outsource certain retrieval and storage functionality.
 */
export class EdmConnectorService implements EDMInterface{
  //TODO document service properly when storage and retrieval functionality is settled
  private rtpToken;
  constructor(private http: HttpClient,
              private edmHelper: EDMHelperService) {
  }

  /**
   * Function to acquire the access token for the EDM based on the participant authentication data.
   * Return the token and stores it in this service upon resolving the promise.
   * @return Returns a promise that resolves to the token when processed.
   */
  acquireRTPToken(): Promise<string> {
    console.log('attempting to connect to EDM through the backend');
    console.log('proxy: ' + this.edmHelper.proxyUrl);
    //Prepare the HTTP request to the proxy backend to relay to the API
    const requestParameters = new HttpParams()
      .set('tokenEndpoint', this.edmHelper.edmTokenEndpoint)
      .set('piveauHubEndpoint', this.edmHelper.edmPiveauHubEndpoint)
      .set('username', this.edmHelper.edmUsername)
      .set('password', this.edmHelper.edmPassword);
    return new Promise<string>((resolve) => {
      this.http.get(this.edmHelper.proxyUrl + '/acquireEDMRTPToken', {params: requestParameters}).subscribe(res => {
        console.log(res['token']);
        this.rtpToken = res['token'];
        resolve(this.rtpToken);
      });
    });
  }

  storeData(distributionString: string, datasetString: string, objectToStore: object) {
    this.http.post(this.edmHelper.proxyUrl + '/sendPiveauRequest', {
      rtpToken: this.rtpToken,
      piveauHubEndpoint: this.edmHelper.edmPiveauHubEndpoint,
      context: this.edmHelper.EDMcontextString,
      graph: '{ ' + distributionString + datasetString + '}',
      dataset: 'secondTest'
    }).subscribe(res => {
      // TODO do something with the object to store
      console.log(res);
    });
  }
  //TODO fill in
  public loadExperimentDescription(id: string): Promise<ExperimentDescription>{
    const experimentDescriptionPromise = this.edmHelper.retrieveExperimentDescription('https://piveau-ui-windnode.apps.osc.fokus.fraunhofer.de/datasets/experimentdescription1');
    return experimentDescriptionPromise;
  }
//TODO fill in
  public loadExperimentInstance(id: string, respectiveExperiment: ExperimentDescription){
    return this.edmHelper.retrieveExperimentInstance('');
  }
  //TODO fill in
  storeExperimentDescription(experiment: ExperimentDescription, prosumerInstances: Map<number, ProsumerInstance>) {
    const keywords: Map<string, string[]> = new Map<string, string[]>();
    keywords.set('en', ['LabChain data', 'Experiment set', 'experiment data']);
    const transformedProsumers: Array<ExperimentDescriptionProsumer> = new Array<ExperimentDescriptionProsumer>(prosumerInstances.size);
    prosumerInstances.forEach((value, key) => {
      transformedProsumers.push({
        id: key,
        name: value.respectiveProsumer.name,
        coordinates: value.feedInCoordinates,
        startTokens: value.amountTokens,
        assets: {
          loads: value.loads,
          controllableGenerators: value.controllableGenerators,
          nonControllableGenerators: value.nonControllableGenerators,
          storageUnits: value.storage
        }});
      });
    const experimentDescriptionObject = {
      prosumers: transformedProsumers,
      p2pMarketDesign: experiment.p2pMarketDesign,
      description: experiment.description,
      experimentLength: experiment.experimentLength,
      id: experiment.id
    };
    //TODO use different methods to construct the respective strings in order to provide context-specific data to the EDM
    const distributionString = this.edmHelper.constructDistributionString(experiment.description, 'Distribution for experiment ' + experiment.id);
    const datasetString = this.edmHelper.constructDataSetString(experiment.description, 'Dataset for experiment ' + experiment.id, keywords);
    this.storeData(distributionString, datasetString, experimentDescriptionObject);
  }
  //TODO fill in
  storeExperimentInstance(instanceOf: ExperimentDescription, tickLength: number, instanceID: number) {
    const keywords: Map<string, string[]> = new Map<string, string[]>();
    keywords.set('en', ['LabChain data', 'Experiment instance', 'experiment data']);
    const experimentInstanceObject = {
      experimentId: instanceOf.id + '-instance-' + instanceID,
      instanceOfExperiment: instanceOf,
      experimentLength: tickLength
    };
    //TODO use different methods to construct the respective strings in order to provide context-specific data to the EDM
    const distributionString = this.edmHelper.constructDistributionString('Instance ' + experimentInstanceObject.experimentId + ' of the experiment with the following description:\n' + instanceOf.description, 'Distribution for experiment instance ' + experimentInstanceObject.experimentId);
    const datasetString = this.edmHelper.constructDataSetString('Instance ' + experimentInstanceObject.experimentId + ' of the experiment with the following description:\n' + instanceOf.description, 'Dataset for experiment instance ' + experimentInstanceObject.experimentId, keywords);
    this.storeData(distributionString, datasetString, experimentInstanceObject);
  }

  //TODO define prosumer behavior data
  // storeProsumerBehaviorData(currentProsumer: Prosumer, experimentInstance: ExperimentInstance, prosumerBehaviorData: Object) {
  //   const keywords: Map<string, string[]> = new Map<string, string[]>();
  //   keywords.set('en', ['LabChain data', 'Prosumer data', 'experiment data']);
  //   const experimentalData: ProsumerExperimentData = {
  //     respectiveProsumer: currentProsumer,
  //     experimentInstance: experimentInstance,
  //     prosumerBehaviorData: prosumerBehaviorData
  //   };
  //   //TODO use different methods to construct the respective strings in order to provide context-specific data to the EDM
  //   const distributionString = this.edmHelper.constructDistributionString('Experimental data for prosumer ' + currentProsumer.id + ' in experiment instance ' + experimentInstance.experimentID, 'Distribution ' + currentProsumer.id + '-' + experimentInstance.experimentID);
  //   const datasetString = this.edmHelper.constructDataSetString('Dataset for describing experimental data for prosumer ' + currentProsumer.id + ' in experiment instance ' + experimentInstance.experimentID, 'Dataset ' + currentProsumer.id + '-' + experimentInstance.experimentID, keywords);
  //   this.storeData(distributionString, datasetString, experimentalData);
  // }
  initializeDataProvisionService(experimentId: number, prosumerId: number){}

  recordData(experimentInstance: ExperimentInstance, prosumerInstance: ProsumerInstance){
    //TODO think about storing data when data set structure more clear
  }
}



