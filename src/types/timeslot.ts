import IAddress from "./address";
import IDelivery from "./delivery";
import IHoursRange from "./hoursRange";

export default interface ITimeslot {
    id?: string;
    date?: string;
    hoursRange?: IHoursRange;
    address?: IAddress;
    deliveries?: Array<IDelivery>;
};

export enum SlotError {
    DELIVERY_LIMIT_REACHED = 'deliveryLimitReached',
    UNSUPPORTED_ADDRESS = 'unSupportedAddress',
};
export class TimeslotError extends Error {
    errorCode: SlotError;

    constructor(errorCode: SlotError, message?: string) {
        super(message);
        this.errorCode = errorCode;
    }
}