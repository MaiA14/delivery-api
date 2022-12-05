import * as express from "express";
import * as _ from "lodash";
import fetch from 'node-fetch'
import { TypedRequestBody } from "../..";
import { APIS } from "../constants";
import IAddress from "../types/address";


export default class AddressesController {
    public static controllerName = 'addresses';
    public middleware: any;
    public path = `/api/${AddressesController.controllerName}`;
    public router: any = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.post(
            this.path + '/resolve-address',
            this.resolveAddress
        );
    }

    // serachterm for example: 38 Upper Montagu Street, London W1H 1LJ, United Kingdom
    private async resolveAddress(req: TypedRequestBody<{searchTerm: string}>, res: any): Promise<void> {
        console.log('resolveAddress');
        if (!req.body.searchTerm) {
            console.error('Error resolveAddress - missing search term for address');
            res.status(404).send('Error resolveAddress - missing search term for address');
            return;
        }
        try {
            const addressResp = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${req.body.searchTerm}&format=json&apiKey=${APIS.GEO_API_KEY}`)
            const address: any = await addressResp.json();
            let stucturedAddress: IAddress;
            if (address && address.results.length > 0) {
                stucturedAddress = {
                    street: address.results[0].street,
                    line1: address.results[0].address_line1,
                    line2: address.results[0].address_line2,
                    city: address.results[0].country,
                    postcode: address.results[0].postcode
                }
            }
            res.send(stucturedAddress);
        } catch (resolveAddressError: any) {
            console.error(resolveAddressError.stack);
            res.status(404).send('resolveAddressError - could not get fetch address data');
            return;
        }
    }
}
