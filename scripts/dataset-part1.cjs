const fs = require('fs');
const { getLampSvg } = require('./svg-helpers.cjs');

// Let's create the 461 rows dataset
const allData = [
  // Alfa Romeo (1-4)
  { id: 1, lp: "1", brand: "Alfa Romeo", model: "4C", factoryCode: "-", years: "2013-2020", staticSignal: "Statyczna", priceClientStatic: "790 zł", priceBrokerStatic: "790 zł", dynamicSignal: "-", priceClientDynamic: "-", priceBrokerDynamic: "-", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 2, lp: "2", brand: "Alfa Romeo", model: "Giulia", factoryCode: "-", years: "2016-", staticSignal: "Statyczna", priceClientStatic: "690 zł", priceBrokerStatic: "690 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "1 190 zł", priceBrokerDynamic: "1 190 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 3, lp: "3", brand: "Alfa Romeo", model: "Stelvio", factoryCode: "-", years: "2016-", staticSignal: "Statyczna", priceClientStatic: "690 zł", priceBrokerStatic: "690 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "1 190 zł", priceBrokerDynamic: "1 190 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 4, lp: "4", brand: "Alfa Romeo", model: "Tonale", factoryCode: "-", years: "2022-", staticSignal: "Statyczna", priceClientStatic: "1 090 zł", priceBrokerStatic: "1 090 zł", dynamicSignal: "-", priceClientDynamic: "-", priceBrokerDynamic: "-", installation: "Tak", coding: "Tak", lampCount: "2" },

  // Aston Martin (5-13)
  { id: 5, lp: "5", brand: "Aston Martin", model: "Vanquish", factoryCode: "Generacja II", years: "2012-2018", staticSignal: "Statyczna", priceClientStatic: "2 990 zł", priceBrokerStatic: "2 990 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 990 zł", priceBrokerDynamic: "3 990 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 6, lp: "6", brand: "Aston Martin", model: "Vanquish Zagato", factoryCode: "-", years: "2016-2018", staticSignal: "Statyczna", priceClientStatic: "2 990 zł", priceBrokerStatic: "2 990 zł", dynamicSignal: "-", priceClientDynamic: "-", priceBrokerDynamic: "-", installation: "", coding: "Tak", lampCount: "2" },
  { id: 7, lp: "7", brand: "Aston Martin", model: "Vantage", factoryCode: "Generacja II", years: "2018-", staticSignal: "Statyczna", priceClientStatic: "2 490 zł", priceBrokerStatic: "2 490 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 490 zł", priceBrokerDynamic: "3 490 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 8, lp: "8", brand: "Aston Martin", model: "DB11", factoryCode: "-", years: "2016-2023", staticSignal: "Statyczna", priceClientStatic: "3 190 zł", priceBrokerStatic: "3 190 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "4 990 zł", priceBrokerDynamic: "4 990 zł", installation: "Tak", coding: "Tak", lampCount: "4" },
  { id: 9, lp: "9", brand: "Aston Martin", model: "DB12", factoryCode: "-", years: "2023-", staticSignal: "Statyczna", priceClientStatic: "3 190 zł", priceBrokerStatic: "3 190 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "4 990 zł", priceBrokerDynamic: "4 990 zł", installation: "Tak", coding: "Tak", lampCount: "4" },
  { id: 10, lp: "10", brand: "Aston Martin", model: "Lagonda Taraf", factoryCode: "-", years: "2015-2016", staticSignal: "Statyczna", priceClientStatic: "2 990 zł", priceBrokerStatic: "2 990 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 490 zł", priceBrokerDynamic: "3 490 zł", installation: "", coding: "", lampCount: "2" },
  { id: 11, lp: "11", brand: "Aston Martin", model: "DBS", factoryCode: "Generacja II", years: "2018-", staticSignal: "Statyczna", priceClientStatic: "2 490 zł", priceBrokerStatic: "2 490 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 090 zł", priceBrokerDynamic: "3 090 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 12, lp: "12", brand: "Aston Martin", model: "Vantage", factoryCode: "Generacja II", years: "2018-", staticSignal: "Statyczna", priceClientStatic: "2 490 zł", priceBrokerStatic: "2 490 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 090 zł", priceBrokerDynamic: "3 090 zł", installation: "Nie", coding: "Tak", lampCount: "2" },
  { id: 13, lp: "13", brand: "Aston Martin", model: "DBX", factoryCode: "-", years: "2020-", staticSignal: "Statyczna", priceClientStatic: "2 490 zł", priceBrokerStatic: "2 490 zł", dynamicSignal: "Dynamiczna", priceClientDynamic: "3 090 zł", priceBrokerDynamic: "3 090 zł", installation: "Tak", coding: "Tak", lampCount: "2" }
];

console.log('Saved baseline data length:', allData.length);
