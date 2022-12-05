import App from "./app";
import config from "./config";
import AddressesController from "./controllers/addresses";
import DeliveriesController from "./controllers/deliveries";
import TimeslotsController from "./controllers/timeslots";
import TimeslotsService from "./services/timeslots";
import DeliveriesService from "./services/deliveries";

const controllers = {
    [AddressesController.controllerName]: new AddressesController(),
    [DeliveriesController.controllerName]: new DeliveriesController(),
    [TimeslotsController.controllerName]: new TimeslotsController(),
};


const app = new App(controllers, config.server.port);
let processDeliveriesInterval: any = null;
app.listen(() => {
    try {
        TimeslotsService.getTimeslots();
        DeliveriesService.getPendingDeliveries();

        processDeliveriesInterval = setInterval(() => {
            DeliveriesService.processDeliveries();
        }, 5 * 1000) // 5 seconds
    } catch (timeslotLoadError: any) {
        console.error('could not set timeslots', timeslotLoadError.stack);
    }
});


// handle disconnect 
function notifyExit() {
    return new Promise(async function (resolve, reject) {
        try {
            clearInterval(processDeliveriesInterval);
            DeliveriesService.savePendingDeliveries();
            TimeslotsService.saveTimeslotsToFile();
            resolve('');
        } catch (notifyExitError: any) {
            console.log(notifyExitError.stack);
            reject();
        }
    });
}

process.on('SIGINT', function () {
    console.log("SIGINT...");
    notifyExit()
        .then(function () {
            process.exit(1);
        })
        .catch(function () {
            process.exit(1);
        });
});

process.on('SIGTERM', function () {
    console.log("SIGTERM...");
    notifyExit()
        .then(function () {
            process.exit(1);
        })
        .catch(function () {
            process.exit(1);
        });
});

process.on('SIGQUIT', function () {
    console.log("SIGQUIT...");
    notifyExit()
        .then(function () {
            process.exit(1);
        })
        .catch(function () {
            process.exit(1);
        });
});

process.on('exit', function (code) {
    console.log("exit...", code);
});