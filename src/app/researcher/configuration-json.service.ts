import { Injectable } from '@angular/core';
import {ExperimentDescription} from "../core/data-types/ExperimentDescription";
import {ExperimentInstance} from "../core/data-types/ExperimentInstance";

@Injectable({
  providedIn: 'root'
})
export class ConfigurationJSONService {

  constructor() { }

  printExperimentDescriptionJSON(experiment: ExperimentDescription){
    console.log(experiment);
    console.log(JSON.stringify(experiment));
  }

  printExperimentInstanceJSON(experiment: ExperimentInstance){
    console.log(JSON.stringify(experiment));
  }
}
