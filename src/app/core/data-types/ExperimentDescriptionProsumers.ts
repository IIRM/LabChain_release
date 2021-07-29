import {Coordinates} from './Coordinates';
import {Load} from './Load';
import {NonControllableGenerator} from './NonControllableGenerator';
import {StorageUnit} from './StorageUnit';
import {ControllableGenerator} from './ControllableGenerator';

export interface AssetObject {
  loads: Array<Load>;
  controllableGenerators: Array<ControllableGenerator>;
  nonControllableGenerators: Array<NonControllableGenerator>;
  storageUnits: Array<StorageUnit>;
}

export interface ExperimentDescriptionProsumer {
  id: number;
  name: string;
  coordinates: Coordinates;
  startTokens: number;
  assets: AssetObject;
}
