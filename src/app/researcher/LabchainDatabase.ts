import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ExperimentDescription } from '../core/data-types/ExperimentDescription';
import { Load } from '../core/data-types/Load';
import { ControllableGenerator } from '../core/data-types/ControllableGenerator';
import { NonControllableGenerator } from '../core/data-types/NonControllableGenerator';
import { StorageUnit } from '../core/data-types/StorageUnit';
import { ExperimentInstance } from '../core/data-types/ExperimentInstance';
import {AssetObject, ExperimentDescriptionProsumer} from "../core/data-types/ExperimentDescriptionProsumers";
import {P2PMarketDesign} from "../core/data-types/P2PMarketDesign";
import {Coordinates} from "../core/data-types/Coordinates";
import {P2POption} from "../core/data-types/P2POption";
import {TimeRegime} from "../core/data-types/TimeRegime";
import {ProsumerInstance} from "../core/data-types/ProsumerInstance";
import {Prosumer} from "../core/data-types/Prosumer";
import {TransactionFeeEntry} from "../core/data-types/TransactionFeeEntry";

@Injectable({
  providedIn: 'root'
})

/**
 * A service to act as a placeholder for the EDM platform.
 * It mocks the required functionality, and acts as placeholder for the respective requests put into the platform.
 * Since it will be deleted once the EDM platform is established, it will not be further covered in the documentation.
 */
export class LabchainDatabase {

  maxBidSize = 10000;
  maxAskSize = 10000;
  private mockBids: P2POption[] = [
    {
      id: '1',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 81,
      duration: 3,
      price: 2,
      power: 1.5,
      acceptedParty: null
    },
    {
      id: '2',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 12,
      duration: 2,
      price: 1.6,
      power: 1.5,
      acceptedParty: null
    },
    {
      id: '3',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 33,
      duration: 1,
      price: 2.2,
      power: 1.5,
      acceptedParty: null
    },
    {
      id: '4',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 13,
      duration: 2,
      price: 2.1,
      power: 1.5,
      acceptedParty: null
    }
  ];

  private  mockAsks: P2POption[] = [
    {
      id: '1',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 81,
      duration: 3,
      price: 2,
      power: 1.5,
      acceptedParty: null
    },
    {
      id: '2',
      optionCreator: this.getMockProsumerInstance(),
      deliveryTime: 12,
      duration: 2,
      price: 1.6,
      power: 1.5,
      acceptedParty: null
    }
  ];

  standardLoadProfile = [338.5, 233.2, 172.5, 158.2, 154.0, 156.5, 187.5, 360.3, 517.6, 534.0, 492.8, 464.9, 473.3, 522.8,
    517.9, 461.4, 419.3, 420.9, 514.6, 664.7, 748.2, 672.9, 563.9, 466.7, 345.6, 233.2, 172.5, 158.2, 154.0, 156.5, 187.5,
    360.3, 517.6, 534.0, 492.8, 464.9, 473.3, 522.8, 517.9, 461.4, 419.3, 420.9, 514.6, 664.7, 748.2, 672.9, 563.9, 466.7,
    345.6, 233.2, 172.5, 158.2, 154.0, 156.5, 187.5, 360.3, 517.6, 534.0, 492.8, 464.9, 473.3, 522.8, 517.9, 461.4, 419.3,
    420.9, 514.6, 664.7, 748.2, 672.9, 563.9, 466.7, 345.6, 233.2, 172.5, 158.2, 154.0, 156.5, 187.5, 360.3, 517.6, 534.0,
    492.8, 464.9, 473.3, 522.8, 517.9, 461.4, 419.3, 420.9, 514.6, 664.7, 748.2, 672.9, 563.9, 466.7, 345.6, 233.2, 172.5,
    158.2, 154.0, 156.5, 187.5, 360.3, 517.6, 534.0, 492.8, 464.9, 473.3, 522.8, 517.9, 461.4, 419.3, 420.9, 514.6, 664.7,
    748.2, 672.9, 563.9, 466.7, 345.6, 268.2, 211.6, 168.4, 158.8, 153.9, 160.3, 212.4, 327.8, 478.8, 566.8, 591.4, 620.0,
    666.4, 663.3, 613.8, 575.1, 579.0, 722.0, 837.6, 840.5, 687.8, 536.4, 490.0, 415.7, 312.7, 225.1, 180.3, 164.6, 154.9,
    154.5, 163.8, 200.0, 354.1, 554.0, 696.7, 811.1, 826.8, 692.1, 544.5, 466.4, 426.8, 502.8, 625.6, 705.1, 640.5, 542.1,
    459.0, 338.5];
  standardGenerationProfile = [0, 0, 0, 0, 0, 0, 0, 0, 0.00559108105393552, 0.0206233887977502, 0.0887542267903177,
    0.111654223442365, 0.0838662158090328, 0.0339817201781111, 0.0362248485051391, 0.0298302587967458,
    0.00197529210887542, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0136596471257826, 0.0626736750477083,
    0.106330978606582, 0.140145301148348, 0.147443838093006, 0.101744283370719, 0.0564799625029295, 0.0129230975258629,
    0.0004017543272289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00944122668987914, 0.0444942917406006,
    0.103485218788711, 0.189125849543004, 0.214737687903847, 0.209983595031638, 0.146673808965817, 0.0594931199571462,
    0.00311359603602397, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00408450232682715, 0.0257792359971877,
    0.0724162174830091, 0.192607720378988, 0.195687836887743, 0.174227459908266, 0.113026884060397, 0.0580200207573069,
    0.00311359603602397, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0017409354179919, 0.00820248418092337,
    0.0224647627975493, 0.0484783554856205, 0.0363922461414845, 0.0330777729418461, 0.033479527269075, 0.00659546687200777,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00703070072650574, 0.0400415146138137, 0.101175131407145,
    0.112089457296863, 0.148213867220195, 0.184606113361679, 0.133248518530918, 0.0575513073755399, 0.004017543272289,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00947470621714821, 0.0320399075965047, 0.0282567210150993,
    0.0399745555592755, 0.067896481301684, 0.0514245538852991, 0.0250426863972681, 0.0159027754528106, 0.00140614014530115,
    0, 0, 0, 0, 0, 0, 0, 0];

  constructor(  ) { }

  getConfiguredLoads(): Observable<Load[]> {
    const loadsToReturn: Load[] = this.getLoads();
    return of(loadsToReturn);
  }

  getConfiguredStorages(): Observable<StorageUnit[]> {
    const storagesToReturn: StorageUnit[] = this.getStorages();
    return of(storagesToReturn);
  }

  getConfiguredCGs(): Observable<ControllableGenerator[]> {
    const cgsToReturn: ControllableGenerator[] = this.getControllableGenerators();
    return of(cgsToReturn);
  }

  getConfiguredNCGs(): Observable<NonControllableGenerator[]> {
    const ncgsToReturn: NonControllableGenerator[] = this.getNonControllableGenerators();
    return of(ncgsToReturn);
  }

  getDefaultExperiment(): Promise<ExperimentDescription> {
    return new Promise<ExperimentDescription>(resolve => {
      resolve({
        prosumers: this.compileExperimentDescriptionProsumer(),
        p2pMarketDesign: {
          bidClosure: 1,
          askClosure: 1,
          timeSliceLength: 1,
          minBidSize: 0.001,
          minAskSize: 0.001,
          maxPrice: -1,
          feeAmount: 0.1
        },
        feedInTariff: [ 0, 6, 6, 6, 6, 6, 7, 7, 8, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 7, 8, 8, 7, 7, 7, 7, 6, 6, 6, 7, 7, 7, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 7, 7, 8, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 7, 7, 8, 8, 7, 7, 7, 6 ],
        retailPrice: [ 0, 31, 31, 31, 31, 31, 32, 32, 33, 33, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 31, 32, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 32, 33, 33, 32, 32, 32, 32, 31, 31, 31, 32, 32, 32, 33, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 31, 31, 31, 31, 32, 32, 33, 33, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 31, 32, 32, 32, 32, 31, 31, 31, 31, 31, 31, 32, 32, 33, 33, 32, 32, 32, 31 ],
        inbalancePenalty: [ 0, 38,	32,	33,	37,	37,	36,	37,	37,	40,	35,	32,	37,	43,	37,	36,	36,	37,	38,	33,	37,	36,	36,	38,	36,	35,	35,	35,	34,	43,	34,	35,	35,	36,	34,	32,	35,	36,	36,	42,	35,	35,	38,	34,	36,	36,	36,	36,	35,	34,	34,	35,	34,	34,	30,	33,	38,	34,	35,	35,	34,	32,	38,	37,	34,	35,	35,	33,	32,	35,	36,	36, 35,	33,	35,	35,	34,	34,	34,	35,	40, 33,	36,	36,	35,	50,	34,	37,	32,	36,	42,	39,	37,	37,	36,	36,	37,	36,	37,	37,	38,	36,	34,	38,	39,	35,	33,	32,	34,	37,	37,	38,	38,	37,	34,	38,	38,	40,	38,	38,	40,	37,	37,	36,	38,	37,	41,	38,	40,	37,	34,	38,	36,	37,	35,	36,	36,	38,	39,	40,	42,	45,	42,	41,	34,	34,	38,	34,	32,	32,	37,	34,	50,	44,	37,	32,	36,	32,	38,	36,	36,	38,	34,	40,	42,	75,	73,	34,	38],
        description: 'mock experiment for testing',
        experimentLength: 168,
        id: '1'
        });
      });
    }
  addExperimentDescription(descriptionToStore: ExperimentDescription): void {
    console.log('Attempting to store ' + descriptionToStore);
  }

  getDefaultExperimentInstance(experiment: ExperimentDescription): Promise<ExperimentInstance> {
    return new Promise<ExperimentInstance>(resolve => {
      resolve({
        experimentID: 121,
        instanceOfExperiment: experiment
      });
    });
  }

  addNewLoad(load: Load): void {
    console.log('Load ' + load.model + ' added as mock functionality');
    console.log('Newly added load has a load time series of ' + load.powerSeries);
  }

  addNewControllableGenerator(cg: ControllableGenerator): void {
    console.log('Controllable Generator ' + cg.model + ' added as mock functionality');
  }

  addNewNonControllableGenerator(ncg: NonControllableGenerator): void {
    console.log('NonControllableGenerator ' + ncg.model + ' added as mock functionality');
  }

  addNewStorage(storage: StorageUnit): void {
    console.log('Storage ' + storage.model + ' added as mock functionality');
  }

  /**
   *
   */
  getExperimentInstanceIDSet(): Observable<Set<number>> {
    const numberSet = new Set<number>();
    console.log('trying to get the experiment instance IDs, with instances ' + this.getMockExperimentInstances());
    this.getMockExperimentInstances().forEach(currentElement => {
      numberSet.add(currentElement.experimentID);
    });
    return of (numberSet);
  }

  /**
   * returns a mocked experiment description
   */
  getExperimentDescriptions(): ExperimentDescription[] {
    const mockData: ExperimentDescription[] = new Array<ExperimentDescription>();
    mockData[0] = this.getExperimentDescription(0);
    return mockData;
  }

  /**
   * log for new experiment instance
   *
   * @param instanceToAdd ExperimentInstance that is attempted to be added
   */
  addExperimentInstance(instanceToAdd: ExperimentInstance) {
    console.log('Attempting to store ' + instanceToAdd);
  }

  /**
   * returns and array of prosumers with their previously defined start setup
   */
  private compileExperimentDescriptionProsumer(): ExperimentDescriptionProsumer[] {
    const prosumers: Array<ExperimentDescriptionProsumer> = new Array<ExperimentDescriptionProsumer>();
    for(let index = 0; index < 7; index++){
      prosumers.push({
        id: (311 + index),
        name: ('Prosumer ' + index),
        coordinates: {x: 0, y: 0},
        startTokens: 4000,
        assets: this.loadProsumerAssets(index)
      });
    }
    this.getExperimentLength().subscribe(experimentLength => this.initializeProsumerAssets(prosumers, experimentLength));
    return prosumers;
  }

  /**
   * Returns the assets of each prosumer
   *
   * @param index prosumer id
   */
  private loadProsumerAssets(index: number): AssetObject{
    switch (index) {
      case 0:
        return{
          loads: [ new Load('largeLoad311', 0.1, 2,
              [0.000,0.429,0.291,0.242,0.220,0.221,0.208,0.251,0.447,0.648,0.685,0.592,0.538,0.591,0.640,0.640,0.556,0.523,0.494,0.652,0.810,
                0.870,0.771,0.653,0.544,0.425,0.283,0.232,0.236,0.213,0.202,0.225,0.432,0.592,0.667,0.627,0.574,0.549,0.634,0.605,0.519,0.521,0.518,
                0.588,0.766,0.918,0.810,0.674,0.583,0.465,0.279,0.242,0.221,0.185,0.187,0.224,0.471,0.603,0.670,0.571,0.565,0.579,0.626,0.641,0.573,
                0.516,0.534,0.631,0.816,0.865,0.816,0.675,0.576,0.430,0.325,0.222,0.224,0.184,0.233,0.222,0.468,0.617,0.622,0.564,0.588,0.595,0.637,
                0.656,0.578,0.548,0.495,0.597,0.765,0.882,0.823,0.653,0.624,0.409,0.290,0.223,0.206,0.194,0.209,0.248,0.444,0.605,0.642,0.613,0.556,
                0.560,0.597,0.603,0.570,0.506,0.516,0.619,0.783,0.880,0.827,0.685,0.545,0.389,0.319,0.266,0.253,0.195,0.230,0.227,0.282,0.411,0.589,
                0.690,0.728,0.737,0.794,0.793,0.706,0.715,0.719,0.868,0.963,0.987,0.819,0.627,0.571,0.494,0.383,0.272,0.231,0.219,0.194,0.208,0.223,
                0.254,0.482,0.682,0.856,0.985,0.993,0.837,0.635,0.571,0.543,0.602,0.762,0.835,0.758,0.667,0.555])],
          controllableGenerators: [],
          nonControllableGenerators: [ new NonControllableGenerator('smallPV311', 3,
              [0.000,0.000,0.000,0.000,0.000,0.083,0.307,0.705,1.155,1.620,1.470,1.440,0.975,0.428,0.300,0.173,0.248,0.188,0.315,0.480,
                0.120,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.045,0.045,0.555,1.215,1.380,1.590,2.182,2.205,2.287,1.755,1.522,0.780,0.907,
                0.682,0.337,0.098,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.105,0.323,0.735,0.900,1.065,0.923,1.792,0.877,0.435,0.278,0.585,
                0.555,0.015,0.045,0.045,0.038,0.015,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.083,0.352,0.847,1.268,1.590,1.988,2.197,2.273,2.318,
                2.213,2.123,1.553,0.840,0.788,0.375,0.120,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.060,0.105,0.128,0.382,1.110,0.937,1.448,
                2.280,1.702,1.673,1.470,1.762,1.290,0.907,0.420,0.135,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.083,0.330,0.623,1.290,1.462,
                1.485,1.147,1.155,1.425,1.485,1.238,0.983,0.675,0.398,0.315,0.135,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.075,0.360,0.877,
                1.237,1.680,1.560,1.972,2.505,2.363,2.265,2.085,1.620,0.855,0.638,0.270,0.060,0.000,0.000,0.000,0.000])],
          storageUnits: []
        }
      case 1:
        return{
          loads: [ new Load('largeLoad312', 0.1, 2,
              [0.000,0.449,0.294,0.215,0.209,0.227,0.219,0.224,0.432,0.613,0.618,0.606,0.538,0.573,0.632,0.619,0.567,0.551,0.479,0.625,0.821,
                0.879,0.795,0.705,0.561,0.406,0.298,0.236,0.210,0.200,0.249,0.260,0.455,0.610,0.640,0.601,0.602,0.596,0.669,0.618,0.545,0.552,0.517,
                0.617,0.837,0.873,0.790,0.699,0.561,0.401,0.286,0.245,0.237,0.218,0.196,0.287,0.429,0.596,0.651,0.603,0.594,0.569,0.637,0.631,0.571,
                0.504,0.501,0.632,0.816,0.886,0.810,0.633,0.569,0.414,0.283,0.257,0.198,0.215,0.237,0.238,0.451,0.650,0.623,0.587,0.563,0.557,0.620,
                0.602,0.572,0.502,0.500,0.623,0.800,0.907,0.829,0.688,0.573,0.472,0.318,0.214,0.201,0.198,0.216,0.242,0.446,0.602,0.593,0.590,0.568,
                0.562,0.673,0.636,0.548,0.515,0.534,0.585,0.789,0.892,0.756,0.704,0.581,0.419,0.354,0.287,0.214,0.202,0.182,0.224,0.283,0.393,0.555,
                0.701,0.702,0.736,0.794,0.790,0.729,0.665,0.706,0.848,0.991,1.032,0.826,0.633,0.529,0.557,0.379,0.285,0.233,0.196,0.193,0.200,0.194,
                0.280,0.425,0.686,0.810,0.957,0.961,0.828,0.654,0.565,0.521,0.625,0.746,0.880,0.741,0.653,0.555])],
          controllableGenerators: [],
          nonControllableGenerators: [ new NonControllableGenerator('largePV312', 8.5,
              [0.000,0.000,0.000,0.000,0.000,0.249,0.921,2.115,3.465,4.860,4.410,4.320,2.925,1.284,0.900,0.519,0.744,0.564,0.945,1.440,
                0.360,0.024,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.135,0.135,1.665,3.645,4.140,4.770,6.546,6.615,6.861,5.265,4.566,2.340,2.721,
                2.046,1.011,0.294,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.024,0.315,0.969,2.205,2.700,3.195,2.769,5.376,2.631,1.305,0.834,1.755,
                1.665,0.045,0.135,0.135,0.114,0.045,0.000,0.000,0.000,0.000,0.000,0.000,0.024,0.249,1.056,2.541,3.804,4.770,5.964,6.591,6.819,6.954,
                6.639,6.369,4.659,2.520,2.364,1.125,0.360,0.024,0.000,0.000,0.000,0.000,0.000,0.000,0.024,0.180,0.315,0.384,1.146,3.330,2.811,4.344,
                6.840,5.106,5.019,4.410,5.286,3.870,2.721,1.260,0.405,0.024,0.000,0.000,0.000,0.000,0.000,0.000,0.024,0.249,0.990,1.869,3.870,4.386,
                4.455,3.441,3.465,4.275,4.455,3.714,2.949,2.025,1.194,0.945,0.405,0.024,0.000,0.000,0.000,0.000,0.000,0.000,0.024,0.225,1.080,2.631,
                3.711,5.040,4.680,5.916,7.515,7.089,6.795,6.255,4.860,2.565,1.914,0.810,0.180,0.000,0.000,0.000,0.000])],
          storageUnits: [ new StorageUnit('householdStorage312', 5.0, 2.5, 2.5, 0.99, 0.0)]
        }
      case 2:
        return{
          loads: [ new Load('largeLoad313', 0.1, 2,
              [0.000,0.435,0.284,0.221,0.202,0.188,0.211,0.242,0.426,0.659,0.640,0.587,0.602,0.576,0.639,0.657,0.550,0.500,0.514,0.625,0.779,
                0.873,0.818,0.662,0.560,0.430,0.293,0.216,0.225,0.185,0.214,0.218,0.427,0.640,0.632,0.587,0.575,0.575,0.642,0.612,0.555,0.492,0.518,
                0.604,0.837,0.912,0.779,0.626,0.565,0.433,0.302,0.232,0.183,0.256,0.222,0.225,0.442,0.615,0.625,0.570,0.587,0.568,0.649,0.608,0.593,
                0.515,0.513,0.616,0.784,0.933,0.805,0.665,0.574,0.441,0.306,0.209,0.239,0.230,0.225,0.255,0.443,0.637,0.695,0.610,0.571,0.536,0.643,
                0.603,0.519,0.501,0.510,0.657,0.797,0.903,0.819,0.646,0.579,0.435,0.295,0.220,0.203,0.201,0.193,0.273,0.418,0.641,0.651,0.590,0.558,
                0.585,0.662,0.637,0.555,0.505,0.496,0.628,0.789,0.863,0.814,0.717,0.567,0.436,0.388,0.276,0.211,0.207,0.228,0.191,0.272,0.418,0.592,
                0.695,0.694,0.727,0.812,0.837,0.758,0.718,0.675,0.834,1.007,0.940,0.810,0.663,0.539,0.516,0.400,0.271,0.232,0.211,0.202,0.222,0.220,
                0.248,0.437,0.668,0.890,0.980,0.932,0.841,0.650,0.547,0.503,0.631,0.727,0.794,0.808,0.638,0.555])],
          controllableGenerators: [],
          nonControllableGenerators: [ new NonControllableGenerator('smallPV313', 3,
              [0.000,0.000,0.000,0.000,0.000,0.083,0.307,0.705,1.155,1.620,1.470,1.440,0.976,0.428,0.300,0.173,0.248,0.188,0.315,0.480,
                0.120,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.045,0.045,0.555,1.215,1.380,1.589,2.182,2.205,2.288,1.755,1.522,0.780,0.907,
                0.682,0.337,0.098,0.000,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.105,0.322,0.735,0.900,1.065,0.922,1.792,0.878,0.435,0.278,0.585,
                0.555,0.015,0.045,0.045,0.038,0.015,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.083,0.353,0.847,1.268,1.590,1.988,2.198,2.273,2.318,
                2.212,2.122,1.553,0.840,0.787,0.375,0.120,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.060,0.105,0.128,0.383,1.110,0.938,1.447,
                2.280,1.703,1.673,1.470,1.763,1.290,0.908,0.420,0.135,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.083,0.330,0.622,1.290,1.462,
                1.485,1.148,1.155,1.425,1.485,1.238,0.983,0.675,0.397,0.315,0.135,0.008,0.000,0.000,0.000,0.000,0.000,0.000,0.008,0.075,0.360,0.878,
                1.237,1.680,1.560,1.972,2.505,2.362,2.265,2.085,1.620,0.855,0.638,0.270,0.060,0.000,0.000,0.000,0.000])],
          storageUnits: [ new StorageUnit('householdStorage313', 5.0, 2.5, 2.5, 0.99, 0.0)]
        }
      case 3:
        return{
          loads: [ new Load('smallLoad314', 0.1, 2,
              [0.000,0.396,0.316,0.228,0.213,0.248,0.182,0.241,0.416,0.646,0.623,0.602,0.561,0.589,0.587,0.619,0.550,0.503,0.511,0.619,0.811,
                0.885,0.819,0.670,0.614,0.421,0.322,0.235,0.205,0.220,0.226,0.260,0.457,0.611,0.647,0.606,0.554,0.557,0.655,0.622,0.580,0.512,0.518,
                0.631,0.797,0.926,0.801,0.698,0.592,0.463,0.290,0.237,0.227,0.186,0.202,0.229,0.498,0.624,0.630,0.589,0.561,0.561,0.662,0.617,0.547,
                0.504,0.491,0.617,0.766,0.907,0.813,0.646,0.563,0.442,0.271,0.232,0.197,0.186,0.192,0.230,0.501,0.614,0.627,0.616,0.547,0.608,0.619,
                0.628,0.551,0.522,0.537,0.591,0.773,0.882,0.813,0.672,0.551,0.418,0.318,0.237,0.207,0.190,0.196,0.226,0.442,0.627,0.664,0.580,0.571,
                0.538,0.629,0.627,0.599,0.530,0.523,0.612,0.804,0.917,0.787,0.666,0.588,0.401,0.319,0.266,0.241,0.222,0.190,0.215,0.267,0.402,0.624,
                0.689,0.704,0.720,0.817,0.753,0.766,0.673,0.679,0.829,1.016,1.037,0.777,0.673,0.588,0.519,0.388,0.274,0.251,0.211,0.214,0.213,0.218,
                0.250,0.413,0.682,0.834,0.944,0.999,0.829,0.649,0.570,0.516,0.598,0.769,0.812,0.809,0.634,0.550])],
          controllableGenerators: [],
          nonControllableGenerators: [ ],
          storageUnits: [ new StorageUnit('householdStorage314', 5.0, 2.5, 2.5, 0.99, 0.0) ]
        }
      case 4:
        return{
          loads: [ new Load('largeLoad315', 0.1, 2,
              [0.000,0.200,0.123,0.107,0.099,0.093,0.091,0.109,0.198,0.272,0.290,0.258,0.260,0.265,0.290,0.271,0.247,0.226,0.234,0.279,0.341,
                0.390,0.353,0.309,0.258,0.186,0.127,0.111,0.104,0.091,0.089,0.112,0.206,0.266,0.295,0.255,0.249,0.245,0.283,0.271,0.235,0.223,0.230,
                0.291,0.351,0.394,0.354,0.308,0.271,0.189,0.124,0.105,0.089,0.085,0.095,0.109,0.202,0.289,0.279,0.264,0.247,0.246,0.271,0.279,0.257,
                0.226,0.234,0.271,0.355,0.376,0.353,0.289,0.249,0.181,0.140,0.097,0.098,0.103,0.092,0.106,0.198,0.271,0.283,0.275,0.235,0.245,0.281,
                0.279,0.250,0.231,0.236,0.275,0.346,0.391,0.353,0.290,0.262,0.195,0.127,0.101,0.099,0.094,0.098,0.099,0.197,0.290,0.274,0.255,0.243,
                0.256,0.294,0.284,0.246,0.216,0.231,0.268,0.343,0.391,0.349,0.317,0.252,0.198,0.153,0.122,0.096,0.092,0.101,0.100,0.111,0.192,0.271,
                0.303,0.317,0.334,0.375,0.365,0.337,0.306,0.313,0.367,0.432,0.426,0.372,0.289,0.270,0.222,0.176,0.122,0.098,0.089,0.090,0.088,0.093,
                0.111,0.191,0.285,0.367,0.439,0.444,0.384,0.302,0.249,0.227,0.284,0.343,0.377,0.360,0.290,0.246])],
          controllableGenerators: [],
          nonControllableGenerators: [ ],
          storageUnits: [ new StorageUnit('householdStorage315', 5.0, 2.5, 2.5, 0.99, 0.0)]
        }
      case 5:
        return{
          loads: [ new Load('smallLoad316', 0.1, 2,
              [0.000,0.424,0.293,0.239,0.229,0.206,0.187,0.243,0.436,0.630,0.692,0.585,0.555,0.556,0.651,0.616,0.560,0.532,0.524,0.603,0.796,
                0.876,0.774,0.723,0.548,0.449,0.303,0.242,0.238,0.193,0.248,0.240,0.436,0.643,0.655,0.606,0.569,0.568,0.611,0.606,0.556,0.488,0.527,
                0.618,0.769,0.886,0.834,0.692,0.575,0.412,0.276,0.203,0.218,0.197,0.186,0.267,0.448,0.627,0.652,0.628,0.526,0.574,0.639,0.616,0.561,
                0.476,0.509,0.624,0.817,0.925,0.778,0.685,0.579,0.433,0.321,0.222,0.241,0.205,0.199,0.270,0.442,0.603,0.683,0.579,0.579,0.540,0.649,
                0.631,0.550,0.464,0.500,0.592,0.762,0.919,0.788,0.658,0.605,0.409,0.308,0.242,0.207,0.213,0.248,0.245,0.446,0.645,0.592,0.578,0.570,
                0.598,0.630,0.618,0.564,0.530,0.518,0.630,0.798,0.900,0.795,0.654,0.569,0.424,0.347,0.290,0.225,0.203,0.208,0.203,0.267,0.386,0.595,
                0.642,0.695,0.747,0.782,0.768,0.751,0.656,0.712,0.841,0.962,1.045,0.830,0.642,0.622,0.487,0.367,0.266,0.256,0.238,0.215,0.205,0.220,
                0.243,0.436,0.691,0.841,0.969,0.986,0.817,0.645,0.567,0.537,0.620,0.779,0.859,0.754,0.642,0.566])],
          controllableGenerators: [],
          nonControllableGenerators: [ ],
          storageUnits: []
        }
      case 6:
        return{
          loads: [ new Load('largeLoad317', 0.1, 2,
              [0.000,0.186,0.132,0.103,0.086,0.101,0.091,0.106,0.197,0.285,0.284,0.259,0.245,0.247,0.284,0.285,0.258,0.239,0.238,0.290,0.349,
                0.404,0.373,0.294,0.230,0.204,0.147,0.104,0.098,0.094,0.086,0.119,0.197,0.263,0.295,0.258,0.260,0.249,0.279,0.274,0.243,0.236,0.222,
                0.285,0.348,0.386,0.353,0.301,0.262,0.200,0.139,0.106,0.091,0.099,0.087,0.111,0.192,0.287,0.297,0.258,0.239,0.271,0.282,0.274,0.250,
                0.220,0.218,0.308,0.360,0.387,0.366,0.296,0.251,0.181,0.138,0.100,0.091,0.097,0.103,0.104,0.192,0.276,0.270,0.252,0.251,0.254,0.270,
                0.272,0.255,0.222,0.229,0.265,0.350,0.399,0.345,0.318,0.239,0.199,0.136,0.102,0.094,0.095,0.094,0.107,0.193,0.281,0.293,0.271,0.251,
                0.246,0.290,0.271,0.246,0.207,0.232,0.281,0.350,0.389,0.355,0.300,0.251,0.193,0.146,0.124,0.096,0.099,0.097,0.103,0.117,0.191,0.254,
                0.314,0.298,0.321,0.343,0.341,0.331,0.309,0.325,0.385,0.415,0.456,0.348,0.288,0.256,0.231,0.181,0.137,0.110,0.114,0.091,0.095,0.093,
                0.115,0.184,0.304,0.372,0.418,0.425,0.360,0.315,0.246,0.222,0.290,0.338,0.367,0.334,0.288,0.240])],
          controllableGenerators: [],
          nonControllableGenerators: [ ],
          storageUnits: []
        }
      default:
        return null;
    }
  }

  private initializeProsumerAssets(prosumers: Array<ExperimentDescriptionProsumer>, experimentLength: number){
    prosumers.forEach(currentProsumer => {
      currentProsumer.assets.storageUnits.forEach(currentStorage => {
        currentStorage.initiateSchedule(experimentLength);
      });
      currentProsumer.assets.nonControllableGenerators.forEach(currentNCG => {
        currentNCG.initiateProjectedGeneration(experimentLength);
      });
      currentProsumer.assets.controllableGenerators.forEach(currentCG => {
        currentCG.initiateSchedule(experimentLength);
      });
    })
  }

  /**
   * returns an observable of the number of time steps in the experiment
   */
  getExperimentLength(): Observable<number> {
    return of(168);
  }

  getexperimentDesignLength(): Observable<number> {
    return of(168);
  }

  /**
   * returns the TimeRegime which can be either discrete or continuous
   */
  getTimeRegime(): Observable<TimeRegime> {
    const regime = TimeRegime.DISCRETE;
    return of(regime);
  }

  /**
   * returns the step length of each time step
   */
  getTimeStepLength(): Observable<number> {
    const stepLength = 18;
    console.log('returning observable of stepLength');
    return of(stepLength);
  }

  /**
   * returns an observable of a number array which contains the CO2 prices
   */
  getCO2Price(): Observable<number[]> {
    const price = [0.2, 0.2, 0.4];
    return of(price);
  }

  /**
   * returns an observable of a number array which contains the gas prices
   */
  getGasPrice(): Observable<number[]> {
    const price = [0.2, 0.2, 0.4];
    return of(price);
  }

  getPrognosisVisibilityScheme(): Observable<string> {
    return of('default');
  }

  getScheduleVisibilityScheme(): Observable<string> {
    return of('default');
  }

  getBidVisibilityScheme(): Observable<string> {
    return of('default');
  }

  getRole(id: string): Observable<string> {
    if (parseInt(id, 10) < 10) { return of ('role1');
    } else {
      return of('role2'); }
  }

  getP2PMarketDescription(experimentId: number): Observable<P2PMarketDesign> {
    return of({
      bidClosure: 5,
      askClosure: 5,
      timeSliceLength: 1,
      minBidSize: 0.5,
      minAskSize: 0.5,
      maxPrice: -1,
      feeAmount: .1
    });
  }

  getP2PMarketDescriptionExperimentDesign(experimentId: number): Observable<P2PMarketDesign> {
    return of({
      bidClosure: 3,
      askClosure: 3,
      timeSliceLength: 1,
      minBidSize: 0,
      minAskSize: 0,
      maxPrice: -1,
      feeAmount: 0
    });
  }

  getAccellerationFactor(): Observable<number> {
    const accellerationFactor = 10;
    return of(accellerationFactor);
  }

  getCoordinates(): Coordinates {
    const x = 2.3;
    const y = 1.4;
    return {x, y};
  }

  getProsumerData(id = 1): Observable<ProsumerInstance> {
    let prosumerInstance: ProsumerInstance;
    prosumerInstance = new ProsumerInstance(
        new Prosumer(id, 'mock prosumer'),
        this.getControllableGenerators(),
        this.getNonControllableGenerators(),
        this.getLoads(),
        this.getStorages(),
        this.getCoordinates(),
        100);
    return of(prosumerInstance);
  }

  getExperimentDescription(experimentType: number): ExperimentDescription {
    if (experimentType === 0) {
      this.getDefaultExperiment().then(defaultExperiment => {
        return defaultExperiment;
      }).catch(e => {
        console.error('Default experiment could not be loaded!!');
      });
    } else {
      return null;
    }
  }

  getControllableGenerators(): ControllableGenerator[] {
    return [this.getCGenerator()];
  }

  getNonControllableGenerators(): NonControllableGenerator[] {
    return [this.getNCGenerator()];
  }

  getLoads(): Load[] {
    return [this.getLoad1(), this.getLoad2()];
  }

  getRandomizedLoad(): Load {
    const model = 'Load1';
    const relativeControllability = 0;
    const temporalShiftingCapability = 0;
    const load1 = new Load(model, relativeControllability, temporalShiftingCapability);
    return load1;
  }

  getStorages(): StorageUnit[] {
    return [this.getStorage()];
  }

  getNCGenerator(): NonControllableGenerator {
    const standardGenerationProfile = [0, 0, 0, 0, 0, 0, 0, 0, 0.00559108105393552, 0.0206233887977502, 0.0887542267903177,
      0.111654223442365, 0.0838662158090328, 0.0339817201781111, 0.0362248485051391, 0.0298302587967458,
      0.00197529210887542, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0136596471257826, 0.0626736750477083,
      0.106330978606582, 0.140145301148348, 0.147443838093006, 0.101744283370719, 0.0564799625029295, 0.0129230975258629,
      0.0004017543272289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00944122668987914, 0.0444942917406006,
      0.103485218788711, 0.189125849543004, 0.214737687903847, 0.209983595031638, 0.146673808965817, 0.0594931199571462,
      0.00311359603602397, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00408450232682715, 0.0257792359971877,
      0.0724162174830091, 0.192607720378988, 0.195687836887743, 0.174227459908266, 0.113026884060397, 0.0580200207573069,
      0.00311359603602397, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0017409354179919, 0.00820248418092337,
      0.0224647627975493, 0.0484783554856205, 0.0363922461414845, 0.0330777729418461, 0.033479527269075, 0.00659546687200777,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00703070072650574, 0.0400415146138137, 0.101175131407145,
      0.112089457296863, 0.148213867220195, 0.184606113361679, 0.133248518530918, 0.0575513073755399, 0.004017543272289,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00947470621714821, 0.0320399075965047, 0.0282567210150993,
      0.0399745555592755, 0.067896481301684, 0.0514245538852991, 0.0250426863972681, 0.0159027754528106, 0.00140614014530115,
      0, 0, 0, 0, 0, 0, 0, 0];
    const pv =  new NonControllableGenerator('SolarPanel #3',
        4.1, standardGenerationProfile);
    this.getExperimentLength().subscribe(length => pv.initiateProjectedGeneration(length));
    return pv;
  }

  getCGenerator(): ControllableGenerator {
    const model = 'controllable Generator #2';
    const maximalGeneration = 2.0;
    const minimalDowntime = 3;
    const minimalUptime = 4;
    const rampingParameter = 0.2;
    const cg2 = new ControllableGenerator(
        model,
        maximalGeneration,
        minimalDowntime,
        minimalUptime,
        rampingParameter
    );
    this.getExperimentLength().subscribe(length => cg2.initiateSchedule(length));
    return cg2;
  }

  getLoad1(): Load {
    const model = 'Load1';
    const relativeControllability = 0.5;
    const temporalShiftingCapability = 5;
    const load1 = new Load(model, relativeControllability, temporalShiftingCapability, this.standardLoadProfile);
    return load1;
  }

  getLoad2(): Load {
    const model = 'Load2';
    const relativeControllability = 0.1;
    const temporalShiftingCapability = 1;
    const load2 = new Load(model, relativeControllability, temporalShiftingCapability, this.standardLoadProfile);
    return load2;
  }

  getStorage(): StorageUnit {
    const model = 'CoolStore';
    const storageCapacity = 2.1;
    const feedinPower = 0.3;
    const feedoutPower = 0.3;
    const cycleEfficiency = 0.9;
    const initialSOC = 0.2;
    const coolStore = new StorageUnit(model, storageCapacity, feedinPower, feedoutPower, cycleEfficiency, initialSOC);
    this.getExperimentLength().subscribe(length => coolStore.initiateSchedule(length));
    return coolStore;
  }

  getMockProsumerInstance(id = 1): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'mock prosumer'),
        this.getControllableGenerators(),
        this.getNonControllableGenerators(),
        this.getLoads(),
        this.getStorages(),
        this.getCoordinates(),
        100);
  }

  getMockProsumer1Instance(id = 1): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer1'),
        [],
        this.getNonControllableGenerators(),
        [],
        [],
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer2Instance(id = 2): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer2'),
        [],
        this.getNonControllableGenerators(),
        [],
        this.getStorages(),
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer3Instance(id = 3): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer3'),
        [],
        this.getNonControllableGenerators(),
        [],
        this.getStorages(),
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer4Instance(id = 4): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer4'),
        [],
        [],
        [this.getRandomizedLoad()],
        [],
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer5Instance(id = 5): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer5'),
        [],
        [],
        [this.getRandomizedLoad()],
        this.getStorages(),
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer6Instance(id = 6): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer6'),
        [],
        [],
        [this.getRandomizedLoad()],
        [],
        this.getCoordinates(),
        100
    );
  }

  getMockProsumer7Instance(id = 7): ProsumerInstance {
    return new ProsumerInstance(
        new Prosumer(id, 'Prosumer7'),
        [],
        [],
        [this.getRandomizedLoad()],
        [],
        this.getCoordinates(),
        100
    );
  }

  getMaxBidSize() {
    return of(this.maxBidSize);
  }

  getMaxAskSize() {
    return of(this.maxAskSize);
  }

  getMockExperimentInstances(): Set<ExperimentInstance> {
    const collection: Set<ExperimentInstance> = new Set<ExperimentInstance>();
    const respectiveDescription: ExperimentDescription = this.getExperimentDescription(0);
    collection.add({experimentID: 0, instanceOfExperiment: respectiveDescription});
    collection.add({experimentID: 1, instanceOfExperiment: respectiveDescription});
    collection.add({experimentID: 2, instanceOfExperiment: respectiveDescription});
    collection.add({experimentID: 3, instanceOfExperiment: respectiveDescription});
    collection.add({experimentID: 4, instanceOfExperiment: respectiveDescription});
    collection.add({experimentID: 6, instanceOfExperiment: respectiveDescription});
    // console.log('about to return the collection ' + collection + ' with ' + collection.size + ' entries.');
    return collection;
  }

  public getMockBids(): P2POption[] { return this.mockBids; }

  public getMockAsks(): P2POption[] { return  this.mockAsks; }

  /**
   * returns a set of TransactionFeeEntry
   * */
  getMockPublicActorData(): Set<TransactionFeeEntry> {
    const feeEntries = new Set<TransactionFeeEntry>();
    this.mockBids.forEach(currentBid => {
      const entry = {payerID: currentBid.optionCreator.respectiveProsumer.id, amount: currentBid.price * 0.1, correspondingTransaction: currentBid};
      feeEntries.add(entry);
    });
    return feeEntries;
  }
}
