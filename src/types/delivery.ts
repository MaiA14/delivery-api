import IUser from "./user";


export enum DeliveryStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    CANCELED = 'canceled',
    PLACED = 'placed',
    COMPLETED = 'completed'
};

export default interface IDelivery {
    id?: string;
    user: IUser;
    timeslotId: string;
    status?: DeliveryStatus;
}
