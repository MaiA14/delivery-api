import * as moment from 'moment';
import fetch from 'node-fetch';
import * as uuid from 'uuid-v4';
import * as fs from 'fs';
import * as _ from 'lodash';
import IHoursRange from '../types/hoursRange';
import ITimeslot, { SlotError, TimeslotError } from '../types/timeslot';
import IAddress from '../types/address';
import IDelivery, { DeliveryStatus } from '../types/delivery';
import path = require('path');

export default class TimeslotsService {
    static timeslots: any = [];

    private static createDates(): Promise<Array<string>> {
        console.log('createDates');
        const lastYear: moment.Moment = moment().subtract(1, 'year');
        const days = [];
        const FRIDAY: number = 5;
        const SATURDAY: number = 6;
        const DAYS_IN_WEEK: number = 7;

        for (let i = 0; i <= DAYS_IN_WEEK; i++) {
            let date: moment.Moment = moment(lastYear).add(i, 'days').utc();
            if (date.isoWeekday() !== FRIDAY && date.isoWeekday() !== SATURDAY) { // exclude weekends
                days.push(date.format('YYYY-MM-DD'));
            }
        }
        return Promise.resolve(days);
    }

    private static createHoursRange(): Array<IHoursRange> {
        console.log('createHoursRange');
        const locale = 'en';
        const hours: any = [];
        const START_TIME: string = '8:00';
        const END_TIME: string = '19:00';
        const SLOT_PERIOD: number = 120;

        const slot = {
            nextSlot: SLOT_PERIOD,
            startTime: START_TIME,
            endTime: END_TIME
        };

        let slotTime: moment.Moment = moment(slot.startTime, "HH:mm");
        let endTime: moment.Moment = moment(slot.endTime, "HH:mm");

        while (slotTime < endTime) {
            hours.push(slotTime.format("HH:mm"));
            slotTime = slotTime.add(slot.nextSlot, 'minutes');
        }

        const hoursRange: Array<IHoursRange> = [];
        for (let i = 0; i < hours.length; i++) {
            // i + 1 doesn't exist for the last element
            if (hours[i + 1]) {
                hoursRange.push({ start: hours[i], end: hours[i + 1] });
            }
        }
        return hoursRange;
    }


    private static async getHolidaysDates() {
        console.log('getHolidaysDates');
        const holidaysDates: Array<string> = [];
        try {
            const lastYearHolidaysResp = await fetch(`https://holidayapi.com/v1/holidays?pretty&key=3d18e8dc-ddf6-4737-85fc-eb8cc4a75cf0&country=IL&year=2021&month=12`)
            const lastYearHolidays: any = await lastYearHolidaysResp.json();
            if (lastYearHolidays && lastYearHolidays.holidays.length > 0) {
                for (let i = 0; i < lastYearHolidays.holidays.length; i++) {
                    holidaysDates.push(lastYearHolidays.holidays[i].date);
                }
            }

        } catch (holidaysFetchError: any) {
            console.log('holidaysFetchError', holidaysFetchError.stack)
        }

        return holidaysDates;
    };

    public static async prepareTimeslots(): Promise<string[]> {
        console.log('prepareTimeslots');
        const availableDates: Array<string> = [];
        try {
            const promises = [];
            promises.push(TimeslotsService.getHolidaysDates());
            promises.push(TimeslotsService.createDates());

            const data = await Promise.all(promises);
            const holidaysDates = data[0];
            const upweekDates = data[1];
            for (let i = 0; i < upweekDates.length; i++) {
                if (!_.includes(holidaysDates, upweekDates[i])) {
                    availableDates.push(upweekDates[i]);
                }
            }
            return availableDates;
        }
        catch (excludeHolidaysError: any) {
            console.error(excludeHolidaysError.stack);
        }
        return [];
    }

    public static createTimeslots(availableDates: Array<string>): Array<ITimeslot> {
        console.log('createTimeslots', availableDates);
        const timeslots: Array<ITimeslot> = [];
        const hoursRange: Array<IHoursRange> = this.createHoursRange();
        const addresses: Array<IAddress> = require('../db/addresses.json'); // chose some addresses to attach to timeslots

        for (let i = 0; i < availableDates.length; i++) {
            for (let j = 0; j < hoursRange.length; j++) {
                timeslots.push({ id: uuid(), date: availableDates[i], hoursRange: hoursRange[j] })
            }
        }

        // _.sample gerates randomly address for each timeslot. Addres is taken from static addresses json
        for (let i = 0; i < timeslots.length; i++) {
            timeslots[i].address = _.sample(addresses);
            timeslots[i].deliveries = [];
        }
        return timeslots;
    }

    public static saveTimeslotsToFile(): void {
        console.log('saveTimeslotsToFile');
        try {
            fs.writeFileSync(path.join(__dirname, '../db/timeslots.json'), JSON.stringify(TimeslotsService.timeslots, null, 4), 'utf8');
        } catch (saveTimeslotsToFileErrror) {
            console.log('saveTimeslotsToFileErrror', saveTimeslotsToFileErrror.stack);
        }
    }

    public static async getTimeslots(): Promise<void> {
        console.log('getTimeslots');
        try {
            const stats = fs.statSync(path.join(__dirname, '../db/timeslots.json'));
            TimeslotsService.timeslots = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/timeslots.json'), 'utf-8'));
        } catch (getTimeslotsError) {
            console.log('getTimeslots file does not exist');
            const dates = await TimeslotsService.prepareTimeslots();
            TimeslotsService.timeslots = TimeslotsService.createTimeslots(dates);
        }

    }

    public static getTimeslotsByAddress(address: IAddress): ITimeslot[] {
        console.log('getTimeslotsByAddress ', address);
        const timeslotsByAddress: Array<ITimeslot> = [];
        for (let i = 0; i < TimeslotsService.timeslots.length; i++) {
            if (TimeslotsService.timeslots[i].deliveries < 2 && TimeslotsService.timeslots[i].address.street === address.street && TimeslotsService.timeslots[i].address.line1 === address.line1 &&
                TimeslotsService.timeslots[i].address.city === address.city && TimeslotsService.timeslots[i].address.postcode === address.postcode) {
                timeslotsByAddress.push(TimeslotsService.timeslots[i]);
            }
        }
        return timeslotsByAddress
    }

    public static setDeliveryStatus(deliveryId: string, status: DeliveryStatus): void {
        console.log('setDeliveryStatus ', deliveryId, status);
        for (let timeslot of TimeslotsService.timeslots) {
            for (let delivery of timeslot.deliveries) {
                if (delivery.id === deliveryId) {
                    delivery.status = status;
                }
            }
        }
    }

    public static getPlacedDeliveries(date?: string): IDelivery[] {
        console.log('getCurrentWeekDeliveries ');
        const deliveries: Array<IDelivery> = [];
        TimeslotsService.timeslots.forEach(timeslot => {
            if (!date || (date && timeslot.date === date)) {
                const placedDeliveries = timeslot.deliveries.filter(delivery => delivery.status === DeliveryStatus.PLACED);
                if (placedDeliveries.length > 0) {
                    deliveries.push(...placedDeliveries);
                }
            }
        });
        return deliveries;
    }

    public static getCurrentWeekDeliveries(): IDelivery[] {
        return TimeslotsService.getPlacedDeliveries();
    }


    public static getDailyDeliveries(date: string): IDelivery[]  {
        return TimeslotsService.getPlacedDeliveries(date)
    }

    private static getTimeslotById(id: string) {
        console.log('getTimeslotById ', id);
        return _.find(TimeslotsService.timeslots, (timeslot) => {
            return timeslot.id === id;
        })
    }

    public static isTimeslotAvailable(timeslotId: string, address: IAddress): boolean {
        console.log('isTimeslotAvailable ', timeslotId, address);
        const foundTimeslot = TimeslotsService.getTimeslotById(timeslotId);

        if (!foundTimeslot) {
            throw new Error(`Timeslot ${timeslotId} not found`);
        }

        if (foundTimeslot.deliveries.length == 2) {
            throw new TimeslotError(SlotError.DELIVERY_LIMIT_REACHED, `Timeslot ${timeslotId} reached deliveries limit`);
        } else if (address !== foundTimeslot.address.street) {
            throw new TimeslotError(SlotError.UNSUPPORTED_ADDRESS, `Timeslot ${timeslotId} has unsupported address`);
        }
        return true;
    }

    public static saveDeliveryForTimeslot(delivery: IDelivery): boolean {
        console.log('saveDeliveryForTimeslot ', delivery);
        const foundTimeslot = TimeslotsService.getTimeslotById(delivery.timeslotId);

        if (!foundTimeslot) {
            return false;
        }

        foundTimeslot.deliveries.push(delivery);
        return true;
    }
}
