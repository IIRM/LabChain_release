import { Component, OnInit } from '@angular/core';
import {SessionDataService} from '../core/session-data.service';
import {ExperimentInstance} from "../core/data-types/ExperimentInstance";

@Component({
  selector: 'app-grid-operator',
  templateUrl: './grid-operator.component.html',
  styleUrls: ['./grid-operator.component.css']
})

export class GridOperatorComponent implements OnInit {

  public experiment: ExperimentInstance;

  constructor(
    private ess: SessionDataService) { }

  ngOnInit() {
    if(this.ess.experimentInstance){
      this.experiment = this.ess.experimentInstance;
    } else {
      this.ess.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.experiment = experimentInstance;
      });
    }
  }

}
