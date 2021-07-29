import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TimeRegime } from '../core/data-types/TimeRegime';
import { Coordinates } from '../core/data-types/Coordinates';
import { Prosumer } from '../core/data-types/Prosumer';
import { ProsumerInstance } from '../core/data-types/ProsumerInstance';
import { ControllableGenerator } from '../core/data-types/ControllableGenerator';
import { NonControllableGenerator } from '../core/data-types/NonControllableGenerator';
import { Load } from '../core/data-types/Load';
import { StorageUnit } from '../core/data-types/StorageUnit';
import { P2POption } from '../core/data-types/P2POption';
import { P2PMarketDesign } from '../core/data-types/P2PMarketDesign';
import { ExperimentDescription } from '../core/data-types/ExperimentDescription';
import { TransactionFeeEntry } from '../core/data-types/TransactionFeeEntry';
import { ExperimentInstance } from '../core/data-types/ExperimentInstance';
import {ExperimentDescriptionProsumer} from "../core/data-types/ExperimentDescriptionProsumers";
import {LabchainDatabase} from "./LabchainDatabase";

@Injectable({
  providedIn: 'root'
})

// TODO load as randomized SLP
// TODO Strahlungsprofil?
// TODO Coordinates --> any reasonable thing here?

/**
 * Service to provide (stateless) data.
 * This service is predominantly used for providing mock data that will eventually be provided by the EDM service, and will be discarded at the latest in production.
 * Methods are all getter methods that provide mock data, so none will be documented further.
 * Stateful data (on the experiment) is provided by the experiment state service.
 */
export class DatabaseMockdataService {


  constructor() { }


}
