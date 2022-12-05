import * as fs from 'fs';
import path = require('path');
import * as uuid from 'uuid-v4';
import IDelivery, { DeliveryStatus } from '../types/delivery';
import { SlotError, TimeslotError } from '../types/timeslot';
import TimeslotsService from './timeslots';

export default class DeliveriesService {
    static pendingDeliveries: any = {};

    public static addDelivery(newDelivery: IDelivery) {
        console.log('addDelivery ', newDelivery);
        newDelivery.id = uuid();
        newDelivery.status = DeliveryStatus.PENDING;
        DeliveriesService.pendingDeliveries[newDelivery.id] = newDelivery;
    }

    public static cancelDelievery(deliveryId: string): void {
        console.log('cancelDelievery ', deliveryId);
        TimeslotsService.setDeliveryStatus(deliveryId, DeliveryStatus.CANCELED);
    }

    public static markCompleteDelivery(deliveryId: string): void {
        console.log('markCompleteDelivery ', deliveryId);
        TimeslotsService.setDeliveryStatus(deliveryId, DeliveryStatus.COMPLETED);
    }

    public static getCurrentWeekDeliveries() {
        console.log('getCurrentWeekDeliveries');
        return TimeslotsService.getCurrentWeekDeliveries();
    }

    public static getDailyDeliveries(date: string): IDelivery[] {
        console.log('getDailyDeliveries', date);
        return TimeslotsService.getDailyDeliveries(date);
    }

    public static getPendingDeliveries(): void {
        const pendingDeliveriesFilePath = '../db/pendingDeliveries.json';
        fs.stat(pendingDeliveriesFilePath, function (statError, stat) {
            if (statError == null) {
                DeliveriesService.pendingDeliveries = JSON.parse(fs.readFileSync(pendingDeliveriesFilePath, 'utf-8'));
            }
        });
    }

    public static savePendingDeliveries(): void {
        fs.writeFileSync(path.join(__dirname, '../db/pendingDeliveries.json'), JSON.stringify(DeliveriesService.pendingDeliveries, null, 4));
    }

    public static processDeliveries(): void {
        const processedIds: Array<string> = [];
        let errorCode : SlotError;
        for (let i = 0; i < Object.keys(DeliveriesService.pendingDeliveries).length; i++) {
            const deliveryId: string = Object.keys(DeliveriesService.pendingDeliveries)[i];
            if (DeliveriesService.pendingDeliveries[deliveryId].status == DeliveryStatus.PENDING) {
                DeliveriesService.pendingDeliveries[deliveryId].status = DeliveryStatus.PROCESSING;

                try {
                    TimeslotsService.isTimeslotAvailable(DeliveriesService.pendingDeliveries[deliveryId].timeslotId, DeliveriesService.pendingDeliveries[deliveryId].user.address);
                    DeliveriesService.pendingDeliveries[deliveryId].status = DeliveryStatus.PLACED;
                    TimeslotsService.saveDeliveryForTimeslot(DeliveriesService.pendingDeliveries[deliveryId]);
                } catch (slotError) {

                    if (slotError instanceof TimeslotError) {
                         errorCode = (slotError as TimeslotError).errorCode;
                    }
                    DeliveriesService.pendingDeliveries[deliveryId].status = DeliveryStatus.CANCELED;
                }

                processedIds.push(deliveryId);
                console.log('setting status for delivery ', deliveryId, DeliveriesService.pendingDeliveries[deliveryId].status, errorCode);
            }
        }

        // remove processed deliveries from the queue
        for (let i = 0; i < processedIds.length; i++) {
            delete DeliveriesService.pendingDeliveries[processedIds[i]];
        }
    }
}