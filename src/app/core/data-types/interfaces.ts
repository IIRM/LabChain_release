import {P2POption} from "./P2POption";
import {Subject} from "rxjs";
import {ExperimentDescription} from "./ExperimentDescription";
import {ProsumerInstance} from "./ProsumerInstance";
import {ExperimentDescriptionProsumer} from "./ExperimentDescriptionProsumers";
import {ExperimentInstance} from "./ExperimentInstance";

/**
 * The interface for facilitating blockchain transactions.
 * It represents the binding element of the Angular/UI world and the blockchain it uses.
 * Encapsulates all functionality related with the blockchain layer within the LabChain project.
 * Provides an interface to the submission service and does some housekeeping to allow to hide uncommitted bids in the market view
 */
export interface BlockchainInterface {
    /** Set to keep track of unconfirmed bids the participant issued to commit */
    unconfirmedBidCommits: Set<P2POption>;
    /** Set to keep track of unconfirmed asks the participant issued to commit */
    unconfirmedAskCommits: Set<P2POption>;
    // Subjects that emit the respective Arrays to interested parties
    relevantOpenAsksSubject: Subject<P2POption[]>;
    relevantOpenBidsSubject: Subject<P2POption[]>;
    committedBidSubject: Subject<P2POption[]>;
    committedAskSubject: Subject<P2POption[]>;
    /**
     * Method to commit to (accept) an open bid by an interested actor.
     * Adds the respective transaction to the blockchain, and does the respective housekeeping with marking the bid to not be shown.
     *
     * @param bidToCommitTo The bid the participant is committing to
     * @returns true if this was successful, false if anything out of the ordinary happened, and the bid could not be committed to
     */
    commitToP2PBid(bidToCommitTo: P2POption): boolean;

    /**
     * Method to commit to (accept) an open ask by an interested actor.
     * Adds the respective transaction to the blockchain, and does the respective housekeeping updating the open and committed bids stored in this service as well as informing the respective observers
     *
     * @param committedAsk The ask the seller is committing to
     * @returns true if this was successful, false if anything out of the ordinary happened, and the ask could not be committed to
     */
    commitToP2PAsk(committedAsk: P2POption): boolean;

    // Getter for the bids and asks on the blockchain
    getCommitedBids(): P2POption[];
    getCommitedAsks(): P2POption[];
    getOpenBids(): P2POption[];
    getOpenAsks(): P2POption[];

    /**
     * Method to submit a bid to the blockchain layer as an open bid.
     * Requires the bid to not have been committed before (i.e. not be in the list of open or committed bids) and to be valid.
     * Will otherwise not be successful.
     *
     * @param bid The bid to be committed to the blockchain
     * @returns Returns true if the bid has not been committed before and to be valid
     */
    submitBid(bid: P2POption): boolean;
    /**
     * Method to submit an ask to the blockchain layer as an open ask.
     * Requires the ask to not have been committed before (i.e. not be in the list of open or committed asks) and to be valid.
     * Will otherwise not be successful.
     *
     * @param ask The bid to be committed to the blockchain
     * @returns Returns true if the ask has not been committed before and to be valid
     */
    submitAsk(ask: P2POption): boolean;
}

export interface EDMInterface {
    storeData(distributionString: string, datasetString: string, objectToStore: object);
    loadExperimentDescription(id: string): Promise<ExperimentDescription>;
    loadExperimentInstance(id: string, respectiveExperiment: ExperimentDescription);
    storeExperimentDescription(experiment: ExperimentDescription, prosumerInstances: Map<number, ProsumerInstance>);
    storeExperimentInstance(instanceOf: ExperimentDescription, tickLength: number, instanceID: number);

    recordData(experimentInstance: ExperimentInstance, prosumerInstance: ProsumerInstance);
}
