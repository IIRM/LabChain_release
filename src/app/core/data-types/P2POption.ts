import { ProsumerInstance } from './ProsumerInstance';

export interface PhysicalTrade {
  /** The time slice where the provider starts to feed in electricity (i.e. the trading partner buys the right for feedin it out) */
  deliveryTime: number;
  /** The offered duration of the feedin commitment (allowing to determine the energy amount traded (in conjunction with power)) */
  duration: number;
  /** The offered power of the feedin commitment (allowing to determine the energy amount traded (in conjunction with duration)) */
  power: number;
}

/**
 * A P2PBid represents an item in an order book / double auction electricity market.
 * It represents the offer for a commitment on feeding electricity in the grid (sell offer) for a given time interval
 *
 * @param id The identificator number of the respective bid
 * @param provider The Prosumer that provides the electricity offer to the market
 * @param deliveryTime The time slice where the provider starts to feed in electricity (i.e. the trading partner buys the right for feedin it out)
 * @param duration The offered duration of the feedin commitment (allowing to determine the energy amount traded (in conjunction with power))
 * @param price The price the feedin commitment / trade is offered at in Currency/kWh
 * @param power The offered power of the feedin commitment (allowing to determine the energy amount traded (in conjunction with duration))
 */
export interface P2POption extends PhysicalTrade{
  /** The identificator number of the respective bid */
  id: string;
  /** The ProsumerInstance that provides the electricity offer to the market */
  optionCreator: ProsumerInstance;
  /** The time slice where the provider starts to feed in electricity (i.e. the trading partner buys the right for feedin it out) */
  deliveryTime: number;
  /** The offered duration of the feedin commitment (allowing to determine the energy amount traded (in conjunction with power)) */
  duration: number;
  /** The price the feedin commitment / trade is offered at in Currency/kWh */
  price: number;
  /** The offered power of the feedin commitment (allowing to determine the energy amount traded (in conjunction with duration)) */
  power: number;
  /** The counter party accepting an offer if it is transacted (null if open) **/
  acceptedParty: number;
}

export interface ReducedP2POption extends PhysicalTrade{
  /** The identificator number of the respective bid */
  id: string;
  /** The id of the ProsumerInstance that provides the electricity offer to the market */
  optionCreator: number;
  /** The time slice where the provider starts to feed in electricity (i.e. the trading partner buys the right for feedin it out) */
  deliveryTime: number;
  /** The offered duration of the feedin commitment (allowing to determine the energy amount traded (in conjunction with power)) */
  duration: number;
  /** The price the feedin commitment / trade is offered at in Currency/kWh */
  price: number;
  /** The offered power of the feedin commitment (allowing to determine the energy amount traded (in conjunction with duration)) */
  power: number;
  /** The id of the counter party accepting an offer if it is transacted (null if open) **/
  acceptedParty: number;
}
