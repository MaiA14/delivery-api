# Delivery management

A system management for deliveries. System supports concurrent deliveries requestes according timeslots constraints.

## Prerequisites
The following technologies should be installed globally
* Node (preferred version / project version - 14.15.3)
* ts-node
* TypeScript
* Nodemon 


## Installation

Before running this project install node modules in both server with this command:

```
npm install
```

Run Server with the command:

```
nodemon server.ts
```

## Assumptions
* Since Holiday API free version supports only in last year data, I consider last year as this year. Upcoming week is current range of dates of last year.
* address.json is a static json contain 2 addresses for the simplicity of creating timeslots.
* In order to support concurrency while booking a delivery, processing delivery conatins "pending" status. pendingDeliveries.json works like a queue.
* Limitation of up to 10 deliveries in a day is reflcated by the number of timeslots range, for simplicity.
* Available timeslot is a timeslot with less than 2 deliveries.


## Scenarios:
* Book a delivery when timeslot reached to its limit:
![Image of delivery booking](https://i.ibb.co/74TFN4w/delivery.png)

![Image of delivery booking](https://i.ibb.co/hV1zqCk/delivery2.png)

* Book a delivery when the address is unsupported: 
![Image of delivery booking](https://i.ibb.co/ZNy0rdL/delivery3.png)

* Book a delivery - placed successfully (timeslot available):
![Image of delivery booking](https://i.ibb.co/4PnXxVB/delivery4.png)

* Daily deliveries (placed only)
![Image of delivery booking](https://i.ibb.co/YTbzV53/delivery5.png)


* Mark delivery as completed:
![Image of delivery booking](https://i.ibb.co/m6JHjv0/deliverycom.png)


* Weekly deliveries (placed only)
![Image of delivery booking](https://i.ibb.co/bLX5TnG/delivery6.png)

* Structured address:
![Image of delivery booking](https://i.ibb.co/Xy2zdSz/timeslots1.png)

* Timeslots by address (available only, less than 2 deliveries):
![Image of delivery booking](https://i.ibb.co/7yZFm9t/timeslots2.png)


