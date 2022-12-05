import * as express from "express";
import * as _ from "lodash";
import { TypedRequestBody } from "../..";
import DeliveriesService from "../services/deliveries";
import IDelivery from "../types/delivery";
import IUser from "../types/user";

export default class DeliveriesController {
    public static controllerName = 'deliveries';
    public middleware: any;
    public path = `/api/${DeliveriesController.controllerName}`;
    public router: any = express.Router();
    static deliveries: any = [];

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(
            this.path + '/daily',
            this.getDailyDeliveries
        );
        this.router.get(
            this.path + '/weekly',
            this.getWeeklyDeliveries
        );

        this.router.post(
            this.path,
            this.bookDelivery
        );
        this.router.post(
            this.path + '/:delivery_id/complete',
            this.markCompleteDelivery
        );
        this.router.delete(
            this.path + '/:delivery_id',
            this.cancelDelivery
        );
    }

    // since holiday api supports only last year, i took a specific date as today
    // example: http://127.0.0.1:9000/api/deliveries/daily?day=2021-12-07
    public async getDailyDeliveries(req: TypedRequestBody<{ date: string }>, res: express.Response): Promise<void> {
        console.log('getDailyDeliveries', req.query);
        if (!req.query || req.query && !req.query.date) {
            res.status(404).send('Error - get daily deliveries due to missing date');
            return;
        }
        try {
            const deliveries: IDelivery[] = DeliveriesService.getDailyDeliveries(req.query.date);
            if (deliveries.length > 0) {
                res.send(deliveries);
            } else {
                res.status(200).send({ message: 'Cannot find devliveries for today. Try tommorrow.' });
            }
        } catch (getDailyDeliveries: any) {
            console.error('could not get daily deliveries ', getDailyDeliveries.stack);
        }
    }

    public async getWeeklyDeliveries(req: TypedRequestBody<{}>, res: express.Response): Promise<void> {
        console.log('getWeeklyDeliveries');
        try {
            const deliveries = DeliveriesService.getCurrentWeekDeliveries();
            res.send(deliveries);
        } catch (getWeeklyDeliveriesError: any) {
            console.error('could not get weekly deliveries ', getWeeklyDeliveriesError.stack);
        }
    }

    public async bookDelivery(req: TypedRequestBody<{ timeslotId: string, user: IUser }>, res: express.Response): Promise<void> {
        console.log('bookDelivery');
        if (!req.body.user || !req.body.timeslotId) {
            res.status(404).send('Error - could not book delivery due to missing user or timeslot details');
            return;
        }

        if (req.body.user && (!req.body.user.firstName || !req.body.user.lastName || !req.body.user.email ||
            !req.body.user.cell || !req.body.user.address)) {
            res.status(404).send('Error - could not book delivery due to missing user details');
            return;
        }

        DeliveriesService.addDelivery(req.body);
        res.status(200).send({ message: 'Delivery recieved' });
    }

    public async markCompleteDelivery(req: TypedRequestBody<{ delivery_id: string }>, res: express.Response): Promise<void> {
        console.log('markCompleteDelivery');
        if (req.params && !req.params.delivery_id) {
            res.status(404).send('Error 1 - could not mark delivery complete due to missing delivery id');
            return;
        }

        try {
            DeliveriesService.markCompleteDelivery(req.params.delivery_id);
            res.status(200).send({ message: 'Delivery is completed' });
        } catch (markCompleteDeliveryError: any) {
            console.error('could not mark delivery as completed', markCompleteDeliveryError.stack);
        }
    }

    public async cancelDelivery(req: TypedRequestBody<{ delivery_id: string }>, res: express.Response): Promise<void> {
        console.log('cancelDelivery');
        if (req.params && !req.params.delivery_id) {
            res.status(404).send('Error - could not cancel delivery due to missing delivery id');
            return;
        }

        try {
            DeliveriesService.cancelDelievery(req.params.delivery_id);
            res.status(200).send({ message: 'Cancled your delivery' });
        } catch (cancelDelieveryError: any) {
            console.error('could not cancel delivery ', cancelDelieveryError.stack);
        }
    }
}
