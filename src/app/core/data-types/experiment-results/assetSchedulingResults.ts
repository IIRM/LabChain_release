import {Context} from "./Context";
import {DispatchableAsset} from "../DispatchableAsset";
import {ResultLoggerService} from "./result-logger.service";

export interface AssetSchedulingContext extends Context{
    // residualLoadSeries: number[];
    // scheduledGeneration: number[];
    schedulingIndex: number;
}

export class AssetSchedulingDataPoint{
    asset: string;
    scheduledTimeStep: number;
    plannedDispatchValue: number;
    context: AssetSchedulingContext;
    constructor(asset, scheduledTimeStep, plannedDispatchValue, context) {
        this.asset = asset;
        this.scheduledTimeStep = scheduledTimeStep;
        this.plannedDispatchValue = plannedDispatchValue;
        this.context = context;
    }
    toDictionary(){
        return {
            asset: this.asset,
            scheduledTimeStep: this.scheduledTimeStep,
            plannedDispatchValue: this.plannedDispatchValue,
            context: {
                // residualLoadSeries: this.context.residualLoadSeries,
                // scheduledGeneration: this.context.scheduledGeneration,
                t: this.context.t,
                schedulingIndex: this.context.schedulingIndex
            }
        }
    }
}

export class AssetSchedulingResultManager{
    private assetSchedulingData: Array<AssetSchedulingDataPoint> = new Array<AssetSchedulingDataPoint>();
    private freeSchedulingIndex = 0;
    constructor(){
    }
    recordAssetSchedulingDataPoint(asset: DispatchableAsset, scheduledTimeStep: number, plannedDispatchValue: number, residualLoadSeries: number[], scheduledGeneration: number[], t: number){
        ResultLoggerService.schedulingResultLog('Recording the scheduling for the asset ' + asset.model + ' in context', 2);
        ResultLoggerService.schedulingResultLog({asset: asset, scheduledTimeStep: scheduledTimeStep, plannedDispatchValue: plannedDispatchValue, residualLoadSeries: residualLoadSeries, scheduledGeneration: scheduledGeneration, t: t}, 2);
        this.assetSchedulingData.push(new AssetSchedulingDataPoint(
            asset.model, scheduledTimeStep, plannedDispatchValue,{
                // residualLoadSeries: residualLoadSeries,
                // scheduledGeneration: scheduledGeneration,
                t: t,
                schedulingIndex: this.freeSchedulingIndex
            }
        ));
        this.freeSchedulingIndex++;
    }
    retrieveAssetSchedulingData(){
        return this.assetSchedulingData;
    }
    toDictionary(){
        return this.assetSchedulingData.map(dataPoint => dataPoint.toDictionary());
    }
}
