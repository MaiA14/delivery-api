# Delivery API

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
