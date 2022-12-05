import * as express from "express";
import { TypedRequestBody } from "../..";
import TimeslotsService from "../services/timeslots";
import IAddress from "../types/address";


export default class TimeslotsController {
    public static controllerName = 'timeslots';
    public middleware: any;
    public path = `/api/${TimeslotsController.controllerName}`;
    public router: any = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.post(
            this.path,
            this.getTimeslots
        );
    }

    public async getTimeslots(req: TypedRequestBody<{address: IAddress}>, res: express.Response): Promise<void> {
        if ((!req.body.address) ||
            (req.body.address && (!req.body.address.street ||
                !req.body.address.line1 || !req.body.address.line2 ||
                !req.body.address.city || !req.body.address.postcode))) {
            res.status(404).send('Error - could not get timeslots due to missing address details');
            return;
        }
        const timeslotsByAddress: any = TimeslotsService.getTimeslotsByAddress(req.body.address);
        res.status(200).send(timeslotsByAddress);
    }
}
