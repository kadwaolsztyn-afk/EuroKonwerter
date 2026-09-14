const fs = require('fs');
const path = require('path');
const { MODELS_DATA } = require('./models-dataset.cjs');

// Additional models to expand the catalog to 265+ items
const EXTRA_MODELS = [
  // AUDI extras (+10)
  { brand: "Audi", model: "A1 / S1 Sportback (8X / GB)", factoryCode: "8X / GB", years: "2010-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "2 szt.", cod: "VCDS / ODIS w cenie" },
  { brand: "Audi", model: "A4 / S4 / RS4 (B7 / B8 pre-FL)", factoryCode: "8E / 8K pre-FL", years: "2004-2011", pClientStat: "950 zł", pBrokStat: "750 zł", pClientDyn: "1 450 zł", pBrokDyn: "1 150 zł", statSig: "Pomarańczowy LED", dynSig: "Pływający Neon LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Audi", model: "A5 / S5 / RS5 (8T pre-FL)", factoryCode: "8T pre-FL", years: "2007-2011", pClientStat: "1 100 zł", pBrokStat: "850 zł", pClientDyn: "1 600 zł", pBrokDyn: "1 250 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Audi", model: "A6 / S6 / RS6 (C6 / 4F FL)", factoryCode: "4F / C6 FL", years: "2008-2011", pClientStat: "1 050 zł", pBrokStat: "820 zł", pClientDyn: "1 550 zł", pBrokDyn: "1 220 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Audi", model: "A6 / S6 / RS6 (C7 pre-FL)", factoryCode: "4G / C7 pre-FL", years: "2011-2014", pClientStat: "1 300 zł", pBrokStat: "1 000 zł", pClientDyn: "1 900 zł", pBrokDyn: "1 500 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Audi", model: "Q2 / SQ2 (GA)", factoryCode: "GA / GA FL", years: "2016-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Pływający LED", lamps: "2 szt.", cod: "ODIS w cenie" },
  { brand: "Audi", model: "Q4 e-tron / Sportback", factoryCode: "FZ", years: "2021-2024", pClientStat: "1 750 zł", pBrokStat: "1 400 zł", pClientDyn: "2 650 zł", pBrokDyn: "2 120 zł", statSig: "Statyczny LED", dynSig: "Matrix Dynamiczny + Listwa", lamps: "4 szt. + listwa", cod: "ODIS Online w cenie" },
  { brand: "Audi", model: "e-tron GT / RS e-tron GT", factoryCode: "FW", years: "2021-2024", pClientStat: "2 400 zł", pBrokStat: "1 920 zł", pClientDyn: "3 600 zł", pBrokDyn: "2 880 zł", statSig: "Statyczny LED", dynSig: "Laser Matrix Animacja", lamps: "4 szt. + listwa ciągła", cod: "ODIS Online w cenie" },
  { brand: "Audi", model: "R8 V8 / V10 (42 / 4S)", factoryCode: "Typ 42 / 4S", years: "2007-2024", pClientStat: "2 200 zł", pBrokStat: "1 760 zł", pClientDyn: "3 400 zł", pBrokDyn: "2 720 zł", statSig: "Statyczny LED", dynSig: "Laser Matrix Dynamic", lamps: "2 szt.", cod: "VCDS / ODIS w cenie" },
  { brand: "Audi", model: "TT / TTS (8J FL)", factoryCode: "8J FL", years: "2010-2014", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 650 zł", pBrokDyn: "1 300 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic", lamps: "2 szt.", cod: "VCDS w cenie" },

  // BMW extras (+12)
  { brand: "BMW", model: "Seria 1 (E81 / E82 / E87 / E88)", factoryCode: "E8x LCI", years: "2007-2013", pClientStat: "900 zł", pBrokStat: "720 zł", pClientDyn: "1 400 zł", pBrokDyn: "1 100 zł", statSig: "Pomarańczowy LED ECE", dynSig: "Pływający Neon LED", lamps: "2 szt.", cod: "NCS Expert w cenie" },
  { brand: "BMW", model: "Seria 3 (E46 FL / M3 CSL)", factoryCode: "E46 FL", years: "2001-2006", pClientStat: "850 zł", pBrokStat: "680 zł", pClientDyn: "1 350 zł", pBrokDyn: "1 050 zł", statSig: "LED Pomarańcz ECE", dynSig: "Dynamiczny Sekwencyjny", lamps: "4 szt.", cod: "NCS Expert w cenie" },
  { brand: "BMW", model: "Seria 5 (E60 / E61 LCI / M5)", factoryCode: "E60 LCI", years: "2007-2010", pClientStat: "1 050 zł", pBrokStat: "820 zł", pClientDyn: "1 600 zł", pBrokDyn: "1 250 zł", statSig: "Pomarańczowy LED", dynSig: "Pływający Neon", lamps: "4 szt.", cod: "NCS Expert w cenie" },
  { brand: "BMW", model: "Seria 7 (F01 / F02 LCI)", factoryCode: "F01 / F02", years: "2008-2015", pClientStat: "1 400 zł", pBrokStat: "1 100 zł", pClientDyn: "2 100 zł", pBrokDyn: "1 650 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LCI LED", lamps: "4 szt.", cod: "E-Sys w cenie" },
  { brand: "BMW", model: "X1 (E84 / F48 / U11)", factoryCode: "E84 / F48 / U11", years: "2012-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 550 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "4 szt.", cod: "E-Sys w cenie" },
  { brand: "BMW", model: "X2 (F39 / U10)", factoryCode: "F39 / U10", years: "2018-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic 3D", lamps: "4 szt.", cod: "E-Sys w cenie" },
  { brand: "BMW", model: "X4 (F26 / M40i)", factoryCode: "F26", years: "2014-2018", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "E-Sys w cenie" },
  { brand: "BMW", model: "Z4 (E89 / G29 / M40i)", factoryCode: "E89 / G29", years: "2009-2024", pClientStat: "1 450 zł", pBrokStat: "1 160 zł", pClientDyn: "2 250 zł", pBrokDyn: "1 800 zł", statSig: "Statyczny LED", dynSig: "Dynamic Blade LED", lamps: "2 szt.", cod: "E-Sys w cenie" },
  { brand: "BMW", model: "i3 / i3s (I01)", factoryCode: "I01", years: "2013-2022", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "U-Shape Dynamic LED", lamps: "2 szt.", cod: "BimmerCode w cenie" },
  { brand: "BMW", model: "i4 / iX3 (G26e / G08)", factoryCode: "G26e / G08", years: "2021-2024", pClientStat: "1 650 zł", pBrokStat: "1 320 zł", pClientDyn: "2 500 zł", pBrokDyn: "2 000 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Laser LED", lamps: "4 szt.", cod: "E-Sys / ISTA w cenie" },
  { brand: "BMW", model: "iX / i7 (I20 / G70)", factoryCode: "I20 / G70", years: "2021-2024", pClientStat: "2 200 zł", pBrokStat: "1 760 zł", pClientDyn: "3 400 zł", pBrokDyn: "2 720 zł", statSig: "Statyczny LED", dynSig: "Ultra Slim Laser Dynamic", lamps: "2 szt. + listwa", cod: "ISTA Online w cenie" },
  { brand: "BMW", model: "X6 (E71 / E72 LCI)", factoryCode: "E71 LCI", years: "2012-2014", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 900 zł", pBrokDyn: "1 500 zł", statSig: "Statyczny LED", dynSig: "Pływający Neon LED", lamps: "4 szt.", cod: "NCS / E-Sys w cenie" },

  // MERCEDES-BENZ extras (+12)
  { brand: "Mercedes-Benz", model: "Klasa C (W204 / C204 FL)", factoryCode: "W204 FL", years: "2011-2014", pClientStat: "1 050 zł", pBrokStat: "820 zł", pClientDyn: "1 600 zł", pBrokDyn: "1 250 zł", statSig: "Statyczny LED C-Shape", dynSig: "Dynamiczny Sekwencyjny", lamps: "2 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "Klasa E (W211 FL)", factoryCode: "W211 FL", years: "2006-2009", pClientStat: "950 zł", pBrokStat: "750 zł", pClientDyn: "1 450 zł", pBrokDyn: "1 150 zł", statSig: "Pomarańczowy LED", dynSig: "Pływający Neon", lamps: "2 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "Klasa E (W212 pre-FL)", factoryCode: "W212 pre-FL", years: "2009-2013", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 700 zł", pBrokDyn: "1 350 zł", statSig: "Statyczny LED", dynSig: "Pływający Neon LED", lamps: "4 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "Klasa S (W221 FL)", factoryCode: "W221 FL", years: "2009-2013", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "2 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "CLA (C117 / X117 FL)", factoryCode: "C117 FL", years: "2013-2019", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Butterfly LED Dynamic", lamps: "2 szt.", cod: "Vediamo / DTS w cenie" },
  { brand: "Mercedes-Benz", model: "CLS (C218 / X218 FL)", factoryCode: "C218 FL", years: "2014-2018", pClientStat: "1 450 zł", pBrokStat: "1 160 zł", pClientDyn: "2 250 zł", pBrokDyn: "1 800 zł", statSig: "Statyczny LED", dynSig: "Multibeam Dynamic LED", lamps: "2 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "GLA (X156 / H247)", factoryCode: "X156 / H247", years: "2014-2024", pClientStat: "1 300 zł", pBrokStat: "1 040 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 560 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "4 szt.", cod: "DTS Monaco w cenie" },
  { brand: "Mercedes-Benz", model: "GLB (X247)", factoryCode: "X247", years: "2019-2024", pClientStat: "1 400 zł", pBrokStat: "1 120 zł", pClientDyn: "2 100 zł", pBrokDyn: "1 680 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "4 szt.", cod: "DTS Monaco w cenie" },
  { brand: "Mercedes-Benz", model: "ML / GLE (W166 / C292 Coupe)", factoryCode: "W166 / C292", years: "2011-2019", pClientStat: "1 400 zł", pBrokStat: "1 120 zł", pClientDyn: "2 150 zł", pBrokDyn: "1 720 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "Vediamo / DTS w cenie" },
  { brand: "Mercedes-Benz", model: "SL / SLC (R231 / R172)", factoryCode: "R231 / R172", years: "2012-2020", pClientStat: "1 600 zł", pBrokStat: "1 280 zł", pClientDyn: "2 450 zł", pBrokDyn: "1 960 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "2 szt.", cod: "Vediamo w cenie" },
  { brand: "Mercedes-Benz", model: "AMG GT Coupe / 4-Door (C190 / X290)", factoryCode: "C190 / X290", years: "2015-2024", pClientStat: "2 100 zł", pBrokStat: "1 680 zł", pClientDyn: "3 200 zł", pBrokDyn: "2 560 zł", statSig: "Statyczny LED", dynSig: "Multibeam Dynamic Blade", lamps: "2 szt. + listwa", cod: "DTS Monaco w cenie" },
  { brand: "Mercedes-Benz", model: "EQE / EQS (V295 / V297)", factoryCode: "V295 / V297", years: "2021-2024", pClientStat: "2 200 zł", pBrokStat: "1 760 zł", pClientDyn: "3 400 zł", pBrokDyn: "2 720 zł", statSig: "Statyczny LED", dynSig: "Helical 3D Matrix Dynamic", lamps: "4 szt. + pas świetlny", cod: "DTS Monaco Online" },

  // FORD extras (+6)
  { brand: "Ford", model: "Focus MK3 / MK4 (RS / ST)", factoryCode: "C346 / C519", years: "2011-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "2 szt.", cod: "FORScan w cenie" },
  { brand: "Ford", model: "Mondeo MK5 / Fusion USA (CD4)", factoryCode: "CD4 (USA -> EU)", years: "2013-2022", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 900 zł", pBrokDyn: "1 500 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "FORScan w cenie" },
  { brand: "Ford", model: "Escape / Kuga (C520 / CX482)", factoryCode: "CX482 (USA -> EU)", years: "2013-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "FORScan w cenie" },
  { brand: "Ford", model: "Explorer V (U502 FL)", factoryCode: "U502 FL", years: "2015-2019", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "2 szt.", cod: "FORScan w cenie" },
  { brand: "Ford", model: "Ranger / Ranger Raptor (T6 / P703)", factoryCode: "T6 / P703", years: "2015-2024", pClientStat: "1 400 zł", pBrokStat: "1 120 zł", pClientDyn: "2 150 zł", pBrokDyn: "1 720 zł", statSig: "Statyczny LED", dynSig: "C-Clamp Matrix Dynamic", lamps: "2 szt.", cod: "FORScan w cenie" },
  { brand: "Ford", model: "Transit Custom / Tourneo", factoryCode: "V362 / V363", years: "2018-2024", pClientStat: "1 200 zł", pBrokStat: "950 zł", pClientDyn: "1 800 zł", pBrokDyn: "1 440 zł", statSig: "Statyczny LED", dynSig: "Pionowy Dynamic LED", lamps: "2 szt.", cod: "FORScan w cenie" },

  // VOLKSWAGEN extras (+6)
  { brand: "Volkswagen", model: "Golf VI / GTI / R (5K)", factoryCode: "MK6 (5K)", years: "2008-2013", pClientStat: "950 zł", pBrokStat: "750 zł", pClientDyn: "1 450 zł", pBrokDyn: "1 150 zł", statSig: "Statyczny LED R-Line", dynSig: "Pływający Neon LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Volkswagen", model: "Passat CC / CC FL (357 / 358)", factoryCode: "357 / 358", years: "2008-2016", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED", dynSig: "Pływający Neon LED", lamps: "4 szt.", cod: "VCDS w cenie" },
  { brand: "Volkswagen", model: "Jetta VI / VII (162 / BU3 USA)", factoryCode: "162 / BU3", years: "2011-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "VCDS / ODIS w cenie" },
  { brand: "Volkswagen", model: "Scirocco III / R (137 / 138 FL)", factoryCode: "137 / 138", years: "2008-2017", pClientStat: "1 100 zł", pBrokStat: "850 zł", pClientDyn: "1 650 zł", pBrokDyn: "1 300 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic", lamps: "2 szt.", cod: "VCDS w cenie" },
  { brand: "Volkswagen", model: "T-Roc / Taigo (A11 / CS1)", factoryCode: "A11 / CS1", years: "2017-2024", pClientStat: "1 300 zł", pBrokStat: "1 040 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 560 zł", statSig: "Statyczny LED", dynSig: "IQ.Light Dynamiczny", lamps: "4 szt.", cod: "ODIS w cenie" },
  { brand: "Volkswagen", model: "ID.3 / ID.4 / ID.5 (E11 / E21)", factoryCode: "MEB Family", years: "2020-2024", pClientStat: "1 600 zł", pBrokStat: "1 280 zł", pClientDyn: "2 450 zł", pBrokDyn: "1 960 zł", statSig: "Statyczny LED", dynSig: "IQ.Light 3D Animacja", lamps: "4 szt. + listwa", cod: "ODIS Online w cenie" },

  // TOYOTA extras (+6)
  { brand: "Toyota", model: "Corolla / Corolla Cross (E210 / XG10)", factoryCode: "E210 / XG10", years: "2018-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamic LED J-Shape", lamps: "4 szt.", cod: "Techstream w cenie" },
  { brand: "Toyota", model: "Prius IV / Prius V (XW50 / XW60)", factoryCode: "XW50 / XW60", years: "2015-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Hammerhead Dynamic LED", lamps: "2 szt. + listwa", cod: "Techstream w cenie" },
  { brand: "Toyota", model: "C-HR I / C-HR II (AX10 / AX20)", factoryCode: "AX10 / AX20", years: "2016-2024", pClientStat: "1 300 zł", pBrokStat: "1 040 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 560 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Sekwencyjny", lamps: "2 szt.", cod: "Techstream w cenie" },
  { brand: "Toyota", model: "Land Cruiser 150 / 200 / 300", factoryCode: "J150 / J200 / J300", years: "2014-2024", pClientStat: "1 850 zł", pBrokStat: "1 480 zł", pClientDyn: "2 850 zł", pBrokDyn: "2 280 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamic Sequential LED", lamps: "4 szt.", cod: "Techstream w cenie" },
  { brand: "Toyota", model: "Tacoma II / III (N200 / N300)", factoryCode: "N300 (USA -> EU)", years: "2015-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED ECE", dynSig: "Dynamiczny LED ECE", lamps: "2 szt.", cod: "Techstream w cenie" },
  { brand: "Toyota", model: "4Runner V (N280 FL)", factoryCode: "N280 FL", years: "2014-2024", pClientStat: "1 400 zł", pBrokStat: "1 120 zł", pClientDyn: "2 100 zł", pBrokDyn: "1 680 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "2 szt.", cod: "Techstream w cenie" },

  // LEXUS extras (+4)
  { brand: "Lexus", model: "CT 200h (ZWA10 FL)", factoryCode: "ZWA10", years: "2014-2020", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "L-Shaped Dynamic LED", lamps: "2 szt.", cod: "Techstream w cenie" },
  { brand: "Lexus", model: "RC / RC F (XC10)", factoryCode: "XC10", years: "2014-2024", pClientStat: "1 850 zł", pBrokStat: "1 480 zł", pClientDyn: "2 850 zł", pBrokDyn: "2 280 zł", statSig: "Statyczny LED", dynSig: "Triple-Beam Dynamic L-Finesse", lamps: "2 szt.", cod: "Techstream w cenie" },
  { brand: "Lexus", model: "LC 500 / LC 500h (Z100)", factoryCode: "URZ100", years: "2017-2024", pClientStat: "2 400 zł", pBrokStat: "1 920 zł", pClientDyn: "3 600 zł", pBrokDyn: "2 880 zł", statSig: "Statyczny LED", dynSig: "Infinity Mirror 3D Dynamic", lamps: "2 szt.", cod: "Techstream w cenie" },
  { brand: "Lexus", model: "UX 200 / UX 250h (ZA10)", factoryCode: "ZA10", years: "2018-2024", pClientStat: "1 500 zł", pBrokStat: "1 200 zł", pClientDyn: "2 250 zł", pBrokDyn: "1 800 zł", statSig: "Statyczny LED", dynSig: "Aero Stabilizing Blade LED", lamps: "2 szt. + listwa", cod: "Techstream w cenie" },

  // PORSCHE extras (+4)
  { brand: "Porsche", model: "911 (997.1 / 997.2 FL)", factoryCode: "997 / 997 FL", years: "2004-2012", pClientStat: "1 600 zł", pBrokStat: "1 280 zł", pClientDyn: "2 450 zł", pBrokDyn: "1 960 zł", statSig: "Statyczny LED ECE", dynSig: "Pływający Neon LED", lamps: "2 szt.", cod: "PIWIS 2 w cenie" },
  { brand: "Porsche", model: "Boxster / Cayman (987 / 981)", factoryCode: "987 / 981", years: "2005-2016", pClientStat: "1 500 zł", pBrokStat: "1 200 zł", pClientDyn: "2 300 zł", pBrokDyn: "1 840 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "2 szt.", cod: "PIWIS 2/3 w cenie" },
  { brand: "Porsche", model: "Cayenne (9PA / 92A 957/958)", factoryCode: "957 / 958", years: "2007-2017", pClientStat: "1 750 zł", pBrokStat: "1 400 zł", pClientDyn: "2 650 zł", pBrokDyn: "2 120 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED 4-Point", lamps: "4 szt.", cod: "PIWIS 2/3 w cenie" },
  { brand: "Porsche", model: "Panamera (970 / 970 FL)", factoryCode: "970 / 970 FL", years: "2009-2016", pClientStat: "1 950 zł", pBrokStat: "1 560 zł", pClientDyn: "2 950 zł", pBrokDyn: "2 360 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "4 szt.", cod: "PIWIS 2/3 w cenie" },

  // CHEVROLET extras (+4)
  { brand: "Chevrolet", model: "Corvette C6 (Grand Sport / Z06 / ZR1)", factoryCode: "C6", years: "2005-2013", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 100 zł", pBrokDyn: "1 680 zł", statSig: "Pomarańczowy LED ECE", dynSig: "Okrągłe Dynamiczne Halo", lamps: "4 szt. (okrągłe)", cod: "Tech2 w cenie" },
  { brand: "Chevrolet", model: "Camaro V (LS / LT / SS / ZL1)", factoryCode: "Camaro 5gen", years: "2010-2015", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 550 zł", statSig: "Statyczny Pomarańcz ECE", dynSig: "Dynamiczny Sekwencyjny", lamps: "2 szt.", cod: "GDS2 w cenie" },
  { brand: "Chevrolet", model: "Cruze / Malibu (J300 / V400)", factoryCode: "J300 / V400", years: "2011-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED ECE", lamps: "4 szt.", cod: "GDS2 w cenie" },
  { brand: "Chevrolet", model: "Equinox / Colorado", factoryCode: "D2XX / RG", years: "2015-2024", pClientStat: "1 300 zł", pBrokStat: "1 040 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 560 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "2 szt.", cod: "GDS2 w cenie" },

  // DODGE extras (+3)
  { brand: "Dodge", model: "Journey / Grand Caravan", factoryCode: "JC49 / RT", years: "2011-2020", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Pomarańczowy LED ECE", dynSig: "Ring LED Dynamic", lamps: "2 szt.", cod: "AlfaOBD w cenie" },
  { brand: "Dodge", model: "Challenger pre-FL (SRT8 / R/T)", factoryCode: "LC", years: "2008-2014", pClientStat: "1 200 zł", pBrokStat: "950 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Pomarańczowy LED", dynSig: "Sekwencja LED", lamps: "1 szt. (blenda)", cod: "AlfaOBD w cenie" },
  { brand: "Dodge", model: "Charger pre-FL (LD / LX)", factoryCode: "LX / LD pre-FL", years: "2006-2014", pClientStat: "1 200 zł", pBrokStat: "950 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Pomarańczowy LED", dynSig: "Racetrack LED", lamps: "1 szt. (blenda)", cod: "AlfaOBD w cenie" },

  // JEEP extras (+3)
  { brand: "Jeep", model: "Grand Cherokee (WK / WH)", factoryCode: "WK / WH", years: "2005-2010", pClientStat: "1 050 zł", pBrokStat: "820 zł", pClientDyn: "1 600 zł", pBrokDyn: "1 250 zł", statSig: "Pomarańczowy LED", dynSig: "Sekwencyjny LED", lamps: "2 szt.", cod: "AlfaOBD w cenie" },
  { brand: "Jeep", model: "Renegade (BU / BV)", factoryCode: "BU / BV", years: "2014-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED X-Shape", dynSig: "X-Shape Dynamic LED", lamps: "2 szt. (kwadratowe X)", cod: "AlfaOBD w cenie" },
  { brand: "Jeep", model: "Patriot / Compass (MK74 / MK49)", factoryCode: "MK49 / MK74", years: "2007-2017", pClientStat: "950 zł", pBrokStat: "750 zł", pClientDyn: "1 450 zł", pBrokDyn: "1 150 zł", statSig: "Pomarańczowy LED", dynSig: "Pływający LED", lamps: "2 szt.", cod: "AlfaOBD w cenie" },

  // HYUNDAI extras (+4)
  { brand: "Hyundai", model: "Tucson (TL / TL FL)", factoryCode: "TL", years: "2015-2020", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny Pływający LED", lamps: "4 szt.", cod: "GDS w cenie" },
  { brand: "Hyundai", model: "Santa Fe (DM / DM FL)", factoryCode: "DM", years: "2012-2018", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "4 szt.", cod: "GDS w cenie" },
  { brand: "Hyundai", model: "i30 / i30 N (PD / PDE)", factoryCode: "PD", years: "2017-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "V-Shape Dynamic LED", lamps: "4 szt.", cod: "GDS w cenie" },
  { brand: "Hyundai", model: "Kona / Kona N / Electric (OS / SX2)", factoryCode: "OS / SX2", years: "2017-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Seamless Horizon Pixel", lamps: "4 szt. + listwa", cod: "GDS Mobile w cenie" },

  // KIA extras (+4)
  { brand: "Kia", model: "Sportage (QL / QL FL)", factoryCode: "QL", years: "2015-2021", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Pływający Dynamic LED", lamps: "4 szt.", cod: "KDS w cenie" },
  { brand: "Kia", model: "Sorento (UM / UM FL)", factoryCode: "UM", years: "2015-2020", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "4 szt.", cod: "KDS w cenie" },
  { brand: "Kia", model: "Ceed / Proceed / XCeed (CD)", factoryCode: "CD", years: "2018-2024", pClientStat: "1 300 zł", pBrokStat: "1 040 zł", pClientDyn: "1 950 zł", pBrokDyn: "1 560 zł", statSig: "Statyczny LED", dynSig: "Honey-Comb Dynamic Matrix", lamps: "4 szt.", cod: "KDS w cenie" },
  { brand: "Kia", model: "Optima / K5 (JF / DL3)", factoryCode: "JF / DL3", years: "2015-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Heartbeat Dynamic LED", lamps: "4 szt.", cod: "KDS w cenie" },

  // NISSAN extras (+3)
  { brand: "Nissan", model: "Qashqai (J11 / J12)", factoryCode: "J11 / J12", years: "2014-2024", pClientStat: "1 250 zł", pBrokStat: "980 zł", pClientDyn: "1 850 zł", pBrokDyn: "1 480 zł", statSig: "Statyczny LED", dynSig: "Boomerang Dynamic LED", lamps: "4 szt.", cod: "Consult III+ w cenie" },
  { brand: "Nissan", model: "Juke (F15 / F16)", factoryCode: "F15 / F16", years: "2010-2024", pClientStat: "1 150 zł", pBrokStat: "900 zł", pClientDyn: "1 750 zł", pBrokDyn: "1 400 zł", statSig: "Statyczny LED", dynSig: "Y-Shape Dynamic LED", lamps: "2 szt.", cod: "Consult III+ w cenie" },
  { brand: "Nissan", model: "Murano / Navara (Z51 / D23)", factoryCode: "Z51 / D23", years: "2010-2024", pClientStat: "1 350 zł", pBrokStat: "1 080 zł", pClientDyn: "2 050 zł", pBrokDyn: "1 640 zł", statSig: "Statyczny LED", dynSig: "Dynamiczny LED", lamps: "4 szt.", cod: "Consult III+ w cenie" }
];

console.log('Extra models count:', EXTRA_MODELS.length);
const ALL_MODELS = [...MODELS_DATA, ...EXTRA_MODELS];
console.log('TOTAL ALL MODELS COMBINED:', ALL_MODELS.length);

const AUDI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M20 50 Q60 20 180 35 L160 75 Q70 70 20 50 Z' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><circle cx='60' cy='48' r='14' fill='%230284c7'/><circle cx='60' cy='48' r='8' fill='%23e0f2fe'/><path d='M90 42 L150 46 L145 58 L85 54 Z' fill='%23fbbf24'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>AUDI MATRIX LED</text></svg>";
const BMW_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M15 45 Q70 15 185 40 L165 80 Q65 75 15 45 Z' fill='%231e293b' stroke='%233b82f6' stroke-width='2'/><path d='M45 35 A12 12 0 1 1 75 55' fill='none' stroke='%2360a5fa' stroke-width='4'/><path d='M100 38 A12 12 0 1 1 130 58' fill='none' stroke='%2360a5fa' stroke-width='4'/><path d='M140 46 L175 48' stroke='%23f59e0b' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>BMW LASERLIGHT</text></svg>";
const MERC_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M25 40 Q80 20 180 45 L155 75 Q75 65 25 40 Z' fill='%231e293b' stroke='%2306b6d4' stroke-width='2'/><path d='M40 38 L160 48' stroke='%2338bdf8' stroke-width='3'/><circle cx='80' cy='52' r='12' fill='%230ea5e9'/><circle cx='80' cy='52' r='6' fill='%23fff'/><path d='M110 50 L150 56' stroke='%23fbbf24' stroke-width='3'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>MERCEDES MULTIBEAM</text></svg>";
const PORSCHE_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><ellipse cx='100' cy='48' rx='75' ry='30' fill='%231e293b' stroke='%23ec4899' stroke-width='2'/><circle cx='70' cy='38' r='5' fill='%23e0f2fe'/><circle cx='130' cy='38' r='5' fill='%23e0f2fe'/><circle cx='70' cy='58' r='5' fill='%23e0f2fe'/><circle cx='130' cy='58' r='5' fill='%23e0f2fe'/><circle cx='100' cy='48' r='12' fill='%233b82f6'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>PORSCHE 4-POINT LED</text></svg>";
const FORD_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 45 L170 30 L160 70 L40 65 Z' fill='%231e293b' stroke='%23f97316' stroke-width='2'/><path d='M50 48 L150 40' stroke='%23fdba74' stroke-width='4'/><path d='M60 58 L140 52' stroke='%23fbbf24' stroke-width='3'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>FORD MUSTANG TRIBAL</text></svg>";
const DODGE_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><rect x='20' y='30' width='160' height='35' rx='6' fill='%23991b1b' stroke='%23ef4444' stroke-width='2'/><rect x='25' y='35' width='150' height='25' fill='%23ef4444'/><text x='100' y='88' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'>DODGE RACETRACK TAIL</text></svg>";
const JEEP_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><circle cx='100' cy='48' r='32' fill='%231e293b' stroke='%2310b981' stroke-width='2'/><circle cx='100' cy='48' r='24' fill='%23064e3b'/><circle cx='100' cy='48' r='12' fill='%23a7f3d0'/><text x='100' y='90' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>JEEP LED ROUND</text></svg>";
const CHEVROLET_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 40 L170 30 L150 65 L40 60 Z' fill='%231e293b' stroke='%23eab308' stroke-width='2'/><circle cx='65' cy='48' r='10' fill='%23fef08a'/><path d='M95 44 L150 40' stroke='%23eab308' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>CHEVROLET CORVETTE</text></svg>";
const CADILLAC_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 30 L170 30 L160 50 L40 50 Z' fill='%231e293b' stroke='%238b5cf6' stroke-width='2'/><rect x='160' y='20' width='14' height='60' rx='3' fill='%23a855f7'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>CADILLAC VERTICAL</text></svg>";
const VW_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M25 45 Q70 25 175 35 L160 70 Q70 65 25 45 Z' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><circle cx='65' cy='48' r='11' fill='%230284c7'/><circle cx='115' cy='46' r='11' fill='%230284c7'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>VW IQ.LIGHT</text></svg>";
const SKODA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 45 L170 35 L155 68 L40 62 Z' fill='%231e293b' stroke='%2322c55e' stroke-width='2'/><path d='M50 48 L150 42' stroke='%2386efac' stroke-width='3'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>SKODA CRYSTAL LED</text></svg>";
const CUPRA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 42 L170 30 L160 66 L45 60 Z' fill='%231e293b' stroke='%23d97706' stroke-width='2'/><polygon points='70,36 85,58 55,58' fill='%23b45309'/><polygon points='115,36 130,58 100,58' fill='%23b45309'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>CUPRA TRIANGLE LED</text></svg>";
const VOLVO_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 48 L170 48 M90 28 L90 68' stroke='%23e0f2fe' stroke-width='6' stroke-linecap='round'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>VOLVO THOR HAMMER</text></svg>";
const LEXUS_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 35 L170 30 L150 65 L40 60 Z' fill='%231e293b' stroke='%236366f1' stroke-width='2'/><path d='M50 42 L95 62 L155 38' fill='none' stroke='%23818cf8' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>LEXUS L-SHAPED LED</text></svg>";
const TOYOTA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 42 L170 32 L155 65 L40 58 Z' fill='%231e293b' stroke='%23ef4444' stroke-width='2'/><circle cx='70' cy='46' r='10' fill='%23dc2626'/><circle cx='120' cy='44' r='10' fill='%23dc2626'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>TOYOTA BI-LED</text></svg>";
const MAZDA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M25 45 Q70 25 175 35 L160 65 Q70 60 25 45 Z' fill='%231e293b' stroke='%23dc2626' stroke-width='2'/><circle cx='80' cy='46' r='14' fill='none' stroke='%23f87171' stroke-width='3'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>MAZDA KODO LED</text></svg>";
const HONDA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 40 L170 30 L155 60 L40 55 Z' fill='%231e293b' stroke='%230284c7' stroke-width='2'/><rect x='50' y='36' width='12' height='14' fill='%2338bdf8'/><rect x='70' y='35' width='12' height='14' fill='%2338bdf8'/><rect x='90' y='34' width='12' height='14' fill='%2338bdf8'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>HONDA JEWEL EYE</text></svg>";
const NISSAN_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 35 L170 30 L150 65 L40 60 Z' fill='%231e293b' stroke='%23f97316' stroke-width='2'/><path d='M40 38 L90 60 L140 36' stroke='%23fdba74' stroke-width='4' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>NISSAN BOOMERANG</text></svg>";
const INFINITI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><ellipse cx='100' cy='48' rx='65' ry='25' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><circle cx='100' cy='48' r='10' fill='%230284c7'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>INFINITI HUMAN EYE</text></svg>";
const HYUNDAI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><rect x='40' y='36' width='14' height='14' fill='%2338bdf8'/><rect x='60' y='36' width='14' height='14' fill='%2338bdf8'/><rect x='80' y='36' width='14' height='14' fill='%2338bdf8'/><rect x='100' y='36' width='14' height='14' fill='%2338bdf8'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>HYUNDAI PARAMETRIC</text></svg>";
const KIA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 40 L170 30 L160 62 L40 56 Z' fill='%231e293b' stroke='%23e11d48' stroke-width='2'/><path d='M40 38 L90 56 L150 34' stroke='%23fb7185' stroke-width='4' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>KIA STAR MAP LED</text></svg>";
const GENESIS_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><rect x='30' y='34' width='140' height='8' rx='4' fill='%23f59e0b'/><rect x='30' y='52' width='140' height='8' rx='4' fill='%23f59e0b'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>GENESIS TWO-LINES</text></svg>";
const ALFA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 40 L170 30 L155 65 L40 60 Z' fill='%231e293b' stroke='%23e11d48' stroke-width='2'/><path d='M50 38 Q75 58 100 38 Q125 58 150 38' stroke='%23f43f5e' stroke-width='3' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>ALFA 3+3 MATRIX</text></svg>";
const MASERATI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 38 L170 28 L155 62 L40 56 Z' fill='%231e293b' stroke='%230284c7' stroke-width='2'/><path d='M50 40 L150 35' stroke='%2338bdf8' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>MASERATI BOOMERANG</text></svg>";
const JAGUAR_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 40 L170 30 L160 58 L40 54 Z' fill='%231e293b' stroke='%23065f46' stroke-width='2'/><path d='M50 42 Q90 56 150 38' stroke='%2334d399' stroke-width='4' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>JAGUAR DOUBLE J-BLADE</text></svg>";
const LANDROVER_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><rect x='30' y='30' width='140' height='38' rx='6' fill='%231e293b' stroke='%2310b981' stroke-width='2'/><circle cx='70' cy='49' r='12' fill='%23047857'/><circle cx='130' cy='49' r='12' fill='%23047857'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>RANGE ROVER SIGNATURE</text></svg>";
const ASTON_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 42 L170 28 L155 60 L40 56 Z' fill='%231e293b' stroke='%23047857' stroke-width='2'/><circle cx='75' cy='45' r='9' fill='%23a7f3d0'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>ASTON MARTIN MATRIX</text></svg>";
const BENTLEY_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><circle cx='65' cy='48' r='20' fill='%231e293b' stroke='%23e0f2fe' stroke-width='3'/><circle cx='135' cy='48' r='14' fill='%231e293b' stroke='%23e0f2fe' stroke-width='2'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>BENTLEY CRYSTAL CUT</text></svg>";
const FERRARI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M30 45 L170 25 L150 60 L40 58 Z' fill='%231e293b' stroke='%23dc2626' stroke-width='2'/><path d='M60 42 L150 30' stroke='%23ef4444' stroke-width='5'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>FERRARI L-BLADE</text></svg>";
const LAMBORGHINI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M40 30 L100 48 L40 66 M100 48 L170 48' stroke='%23eab308' stroke-width='5' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>LAMBO Y-SHAPE</text></svg>";
const TESLA_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M25 40 Q70 25 175 32 L160 58 Q70 55 25 40 Z' fill='%231e293b' stroke='%23dc2626' stroke-width='2'/><path d='M40 38 L160 33' stroke='%23ef4444' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>TESLA MATRIX HIGHLAND</text></svg>";
const PEUGEOT_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M60 25 L50 65 M80 25 L70 65 M100 25 L90 65 M140 25 L130 75' stroke='%2338bdf8' stroke-width='4'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>PEUGEOT 3-CLAWS</text></svg>";
const RENAULT_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M140 25 Q40 25 40 48 Q40 70 140 70' stroke='%23fbbf24' stroke-width='5' fill='none'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>RENAULT C-SHAPE</text></svg>";
const MINI_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><rect x='40' y='25' width='120' height='46' rx='8' fill='%231e293b' stroke='%23ef4444' stroke-width='2'/><path d='M60 25 L140 71 M140 25 L60 71 M100 25 L100 71 M40 48 L160 48' stroke='%23ef4444' stroke-width='3'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>MINI UNION JACK</text></svg>";
const SUBARU_LAMP = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M140 30 Q50 30 50 48 Q50 66 140 66' stroke='%2338bdf8' stroke-width='4' fill='none'/><circle cx='95' cy='48' r='10' fill='%230284c7'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>SUBARU C-LIGHT</text></svg>";

const BRAND_LAMP_MAP = {
  'Audi': AUDI_LAMP,
  'BMW': BMW_LAMP,
  'Mercedes-Benz': MERC_LAMP,
  'Porsche': PORSCHE_LAMP,
  'Ford': FORD_LAMP,
  'Dodge': DODGE_LAMP,
  'Jeep': JEEP_LAMP,
  'Chevrolet': CHEVROLET_LAMP,
  'Cadillac': CADILLAC_LAMP,
  'Volkswagen': VW_LAMP,
  'Skoda': SKODA_LAMP,
  'Cupra': CUPRA_LAMP,
  'Volvo': VOLVO_LAMP,
  'Lexus': LEXUS_LAMP,
  'Toyota': TOYOTA_LAMP,
  'Mazda': MAZDA_LAMP,
  'Honda': HONDA_LAMP,
  'Nissan': NISSAN_LAMP,
  'Infiniti': INFINITI_LAMP,
  'Hyundai': HYUNDAI_LAMP,
  'Kia': KIA_LAMP,
  'Genesis': GENESIS_LAMP,
  'Alfa Romeo': ALFA_LAMP,
  'Maserati': MASERATI_LAMP,
  'Jaguar': JAGUAR_LAMP,
  'Land Rover': LANDROVER_LAMP,
  'Aston Martin': ASTON_LAMP,
  'Bentley': BENTLEY_LAMP,
  'Ferrari': FERRARI_LAMP,
  'Lamborghini': LAMBORGHINI_LAMP,
  'Tesla': TESLA_LAMP,
  'Peugeot': PEUGEOT_LAMP,
  'Renault': RENAULT_LAMP,
  'Mini': MINI_LAMP,
  'Subaru': SUBARU_LAMP
};

const uniqueBrands = Array.from(new Set(ALL_MODELS.map(m => m.brand)));

const extractedImages = uniqueBrands.map((brand, bIndex) => ({
  id: `img-brand-${bIndex + 1}`,
  src: BRAND_LAMP_MAP[brand] || AUDI_LAMP,
  originalSrc: BRAND_LAMP_MAP[brand] || AUDI_LAMP,
  brand: brand,
  model: '',
  rowIndex: bIndex,
  width: 200,
  height: 100
}));

const rows = ALL_MODELS.map((item, index) => {
  const lampImg = BRAND_LAMP_MAP[item.brand] || AUDI_LAMP;
  return {
    id: index + 1,
    lp: String(index + 1),
    brand: item.brand,
    model: item.model,
    factoryCode: item.factoryCode,
    years: item.years,
    staticSignal: item.statSig,
    priceClientStatic: item.pClientStat,
    basePriceClientStatic: item.pClientStat,
    priceBrokerStatic: item.pBrokStat,
    basePriceBrokerStatic: item.pBrokStat,
    dynamicSignal: item.dynSig,
    priceClientDynamic: item.pClientDyn,
    basePriceClientDynamic: item.pClientDyn,
    priceBrokerDynamic: item.pBrokDyn,
    basePriceBrokerDynamic: item.pBrokDyn,
    installation: 'Demontaż / Montaż w cenie',
    coding: item.cod,
    lampCount: item.lamps,
    imageUrl: lampImg,
    imageAlt: `${item.brand} ${item.model} Lampa LED / Dynamic`,
    customNotes: `${item.factoryCode} • Kierunkowskazy: ${item.statSig} / ${item.dynSig} • Kodowanie: ${item.cod}`
  };
});

const comprehensiveDocument = {
  id: 'doc-auto-katalog-pl-v2',
  name: 'Baza Pojazdów USA/EU (35 Marek - 264 Modele)',
  fileType: 'sample',
  sizeFormatted: '380 KB',
  importedAt: new Date().toISOString(),
  totalRows: rows.length,
  brandsCount: uniqueBrands.length,
  headers: [
    'Lp.',
    'Marka',
    'Model',
    'Generacja / Kod',
    'Roczniki',
    'Kierunkowskaz Stat.',
    'Cena Stat. Klient',
    'Cena Stat. Hurt',
    'Kierunkowskaz Dyn.',
    'Cena Dyn. Klient',
    'Cena Dyn. Hurt',
    'Montaż',
    'Kodowanie',
    'Ilość lamp',
    'Zdjęcie'
  ],
  rows: rows,
  images: extractedImages,
  rawHtml: ''
};

// Write data-catalog.json
fs.writeFileSync(path.join(process.cwd(), 'data-catalog.json'), JSON.stringify(comprehensiveDocument, null, 2), 'utf8');
console.log(`Successfully wrote data-catalog.json with ${rows.length} models across ${uniqueBrands.length} brands!`);

// Write src/data/initialCatalog.ts
const docForTs = { ...comprehensiveDocument };
delete docForTs.importedAt;

const initialCatalogTsContent = `import { ImportedDocument } from '../types';

export const INITIAL_COMPREHENSIVE_CATALOG: ImportedDocument = {
  ...${JSON.stringify(docForTs, null, 2)},
  importedAt: new Date()
};

export const INITIAL_35_BRANDS_DOCUMENT: ImportedDocument = INITIAL_COMPREHENSIVE_CATALOG;
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/initialCatalog.ts'), initialCatalogTsContent, 'utf8');
console.log('Successfully wrote src/data/initialCatalog.ts!');
