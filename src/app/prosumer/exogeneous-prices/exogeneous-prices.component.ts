import { Component, OnInit } from '@angular/core';
import { TimeService } from '../../core/time.service';
import { LabchainDatabase } from "../../researcher/LabchainDatabase";

@Component({
  selector: 'app-exogeneous-prices',
  templateUrl: './exogeneous-prices.component.html',
  styleUrls: ['./exogeneous-prices.component.css']
})
export class ExogeneousPricesComponent implements OnInit {

  /** Variable to hold the gas price of the simulation at the respective simulation time */
  public currentGasPrice: number | undefined;
  /** Variable to hold the carbon price of the simulation at the respective simulation time */
  public currentCarbonPrice: number | undefined;
  /** Variable to hold the time series of the gas price of the simulation */
  private gasPriceSeries: number[] = [];
  /** Variable to hold the time series of the carbon price of the simulation */
  private carbonPriceSeries: number[] = [];

  constructor(private timeService: TimeService,
              private database: LabchainDatabase
  ) {
    timeService.timeEmitter.subscribe(currentTime => {
      if (this.carbonPriceSeries[currentTime]) {
        this.currentCarbonPrice = this.carbonPriceSeries[currentTime];
      } else {
        this.currentCarbonPrice = NaN;
      }
      if (this.gasPriceSeries[currentTime]) {
        this.currentGasPrice = this.gasPriceSeries[currentTime];
      } else {
        this.currentGasPrice = NaN;
      }
    });
    this.database.getCO2Price().subscribe(carbonPriceSeries => {
      this.carbonPriceSeries = carbonPriceSeries;
      if (carbonPriceSeries[this.timeService.getCurrentTime()]) {
        this.currentCarbonPrice = carbonPriceSeries[this.timeService.getCurrentTime()];
      } else {
        this.currentCarbonPrice = NaN;
      }
    });
    this.database.getGasPrice().subscribe(gasPriceSeries => {
      this.gasPriceSeries = gasPriceSeries;
      if (gasPriceSeries[this.timeService.getCurrentTime()]) {
        this.currentGasPrice = gasPriceSeries[this.timeService.getCurrentTime()];
      } else {
        this.currentGasPrice = NaN;
      }
    });
  }

  ngOnInit() {
  }
}
