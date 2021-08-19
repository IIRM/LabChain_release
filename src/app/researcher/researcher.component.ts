import { Component, OnInit } from '@angular/core';
import {SessionDataService} from "../core/session-data.service";
import {ExperimentInstance} from "../core/data-types/ExperimentInstance";
import {MockEDMService} from "../core/mockStorageInterfaces/mock-edm.service";
import {LabchainDatabase} from "./LabchainDatabase";
import {ExperimentResultService} from "./experiment-result.service";
//import {ConfigurationJSONService} from "./configuration-json.service";


@Component({
  selector: 'app-researcher',
  templateUrl: './researcher.component.html',
  styleUrls: ['./researcher.component.css']
})

/**
 * Component for the researcher role within the simulation environment.
 * Hosts the children components and allows the user to create new kinds of experiments (Experiment Descriptions),
 * or to create new instances of an existing experiment parameterization (Experiment Instance).
 * Also allow the resercher to supervise an experiment
 */
export class ResearcherComponent implements OnInit {

  /** The experiment (if the researcher supervises an active experiment) */
  public runningExperiment: ExperimentInstance | undefined;
  /** Toggle variable to indicate which editor the user utilizes */
  public editorToShow: string = "";

  constructor(
    private state: SessionDataService,
    private mockEDM: MockEDMService,
    private data: LabchainDatabase,
    private experimentResultService: ExperimentResultService,
  //  private experimentJSON: ConfigurationJSONService
  ) {
  }

  ngOnInit() {
    if(this.state.experimentInstance){
      this.runningExperiment = this.state.experimentInstance;
    } else {
      this.state.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.runningExperiment = experimentInstance;
      });
    }
    this.editorToShow = 'DesignEditor';
  }

  public toggle(str: string): void {
    if (str === 'instance') {
      this.editorToShow = 'InstanceEditor';
    } else if (str === 'design') {
      this.editorToShow = 'DesignEditor';
    }
  }

    readData() {
        //this.experimentResultService.readData();
        this.experimentResultService.saveFile();
    }

  // public printJSON(){
  //   this.data.getDefaultExperiment().then(experimentDescription => {
  //     this.experimentJSON.printExperimentDescriptionJSON(experimentDescription);
  //     this.data.getDefaultExperimentInstance(experimentDescription).then(experimentInstance => {
  //       this.experimentJSON.printExperimentInstanceJSON(experimentInstance);
  //     });
  //   });
  //
  // }
}
