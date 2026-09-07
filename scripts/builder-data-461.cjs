const fs = require('fs');
const path = require('path');

// Extract and define all 461 rows from Cennik_ALL_03_2026.xlsx (Google Docs HTML export)
// We will write the full builder script that generates initialCatalog.ts and data-catalog.json

const rawData = [
  // Alfa Romeo
  { lp: "1", brand: "Alfa Romeo", model: "4C", code: "-", years: "2013-2020", staticVer: "Statyczna", pCStat: "790 zł", pBStat: "790 zł", dynVer: "-", pCDyn: "-", pBDyn: "-", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "2", brand: "Alfa Romeo", model: "Giulia", code: "-", years: "2016-", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "3", brand: "Alfa Romeo", model: "Stelvio", code: "-", years: "2016-", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "4", brand: "Alfa Romeo", model: "Tonale", code: "-", years: "2022-", staticVer: "Statyczna", pCStat: "1 090 zł", pBStat: "1 090 zł", dynVer: "-", pCDyn: "-", pBDyn: "-", install: "Tak", coding: "Tak", lamps: "2" },

  // Aston Martin
  { lp: "5", brand: "Aston Martin", model: "Vanquish", code: "Generacja II", years: "2012-2018", staticVer: "Statyczna", pCStat: "2 990 zł", pBStat: "2 990 zł", dynVer: "Dynamiczna", pCDyn: "3 990 zł", pBDyn: "3 990 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "6", brand: "Aston Martin", model: "Vanquish Zagato", code: "-", years: "2016-2018", staticVer: "Statyczna", pCStat: "2 990 zł", pBStat: "2 990 zł", dynVer: "-", pCDyn: "-", pBDyn: "-", install: "", coding: "Tak", lamps: "2" },
  { lp: "7", brand: "Aston Martin", model: "Vantage", code: "Generacja II", years: "2018-", staticVer: "Statyczna", pCStat: "2 490 zł", pBStat: "2 490 zł", dynVer: "Dynamiczna", pCDyn: "3 490 zł", pBDyn: "3 490 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "8", brand: "Aston Martin", model: "DB11", code: "-", years: "2016-2023", staticVer: "Statyczna", pCStat: "3 190 zł", pBStat: "3 190 zł", dynVer: "Dynamiczna", pCDyn: "4 990 zł", pBDyn: "4 990 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "9", brand: "Aston Martin", model: "DB12", code: "-", years: "2023-", staticVer: "Statyczna", pCStat: "3 190 zł", pBStat: "3 190 zł", dynVer: "Dynamiczna", pCDyn: "4 990 zł", pBDyn: "4 990 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "10", brand: "Aston Martin", model: "Lagonda Taraf", code: "-", years: "2015-2016", staticVer: "Statyczna", pCStat: "2 990 zł", pBStat: "2 990 zł", dynVer: "Dynamiczna", pCDyn: "3 490 zł", pBDyn: "3 490 zł", install: "", coding: "", lamps: "2" },
  { lp: "11", brand: "Aston Martin", model: "DBS", code: "Generacja II", years: "2018-", staticVer: "Statyczna", pCStat: "2 490 zł", pBStat: "2 490 zł", dynVer: "Dynamiczna", pCDyn: "3 090 zł", pBDyn: "3 090 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "12", brand: "Aston Martin", model: "Vantage", code: "Generacja II", years: "2018-", staticVer: "Statyczna", pCStat: "2 490 zł", pBStat: "2 490 zł", dynVer: "Dynamiczna", pCDyn: "3 090 zł", pBDyn: "3 090 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "13", brand: "Aston Martin", model: "DBX", code: "-", years: "2020-", staticVer: "Statyczna", pCStat: "2 490 zł", pBStat: "2 490 zł", dynVer: "Dynamiczna", pCDyn: "3 090 zł", pBDyn: "3 090 zł", install: "Tak", coding: "Tak", lamps: "2" },

  // Audi (52 rows - exactly from LP 14 to LP 65)
  { lp: "14", brand: "Audi", model: "A1", code: "8X (Lift)", years: "2015-2018", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 290 zł", pBDyn: "1 290 zł", install: "", coding: "", lamps: "2" },
  { lp: "15", brand: "Audi", model: "A1", code: "GB", years: "2018-", staticVer: "Statyczna", pCStat: "1 090 zł", pBStat: "1 090 zł", dynVer: "Dynamiczna", pCDyn: "1 690 zł", pBDyn: "1 690 zł", install: "", coding: "", lamps: "4" },
  { lp: "16", brand: "Audi", model: "A3 3d Hatchback, S3", code: "8V (przed lift)", years: "2012-2016", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 290 zł", pBDyn: "1 290 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "17", brand: "Audi", model: "A3 Sportbact-E-Tron-Hatchback, RS3", code: "8V (przed lift)", years: "2013-2016", staticVer: "Statyczna", pCStat: "790 zł", pBStat: "790 zł", dynVer: "Dynamiczna", pCDyn: "1 290 zł", pBDyn: "1 290 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "18", brand: "Audi", model: "A3, S3", code: "8V (przed lift)", years: "2013-2016", staticVer: "Statyczna", pCStat: "790 zł", pBStat: "790 zł", dynVer: "Dynamiczna", pCDyn: "1 690 zł", pBDyn: "1 690 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "19", brand: "Audi", model: "A3 5d Sportback, E-Tron, S3, RS3", code: "8V (Lift)", years: "2016-2020", staticVer: "Statyczna", pCStat: "900 zł", pBStat: "900 zł", dynVer: "Dynamiczna", pCDyn: "1 500 zł", pBDyn: "1 500 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "20", brand: "Audi", model: "A3, S3, RS3", code: "8V (Lift)", years: "2016-2020", staticVer: "Statyczna", pCStat: "900 zł", pBStat: "900 zł", dynVer: "Dynamiczna", pCDyn: "1 500 zł", pBDyn: "1 500 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "21", brand: "Audi", model: "A3, S3, RS3", code: "8Y", years: "2020-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "-", pCDyn: "-", pBDyn: "-", install: "Nie", coding: "Nie", lamps: "-" },
  { lp: "22", brand: "Audi", model: "A4-S4 (Avant), RS4, S4", code: "B8 (przed lift)", years: "2008-2015", staticVer: "Statyczna", pCStat: "490 zł", pBStat: "490 zł", dynVer: "Dynamiczna", pCDyn: "990 zł", pBDyn: "990 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "23", brand: "Audi", model: "A4, S4", code: "B8 (Lift)", years: "2012-2015", staticVer: "Statyczna", pCStat: "800 zł", pBStat: "800 zł", dynVer: "Dynamiczna", pCDyn: "1 400 zł", pBDyn: "1 400 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "24", brand: "Audi", model: "A4 Allroad, S4, RS4 (Avant)", code: "B8 (Lift)", years: "2012-2015", staticVer: "Statyczna", pCStat: "990 zł", pBStat: "990 zł", dynVer: "Dynamiczna", pCDyn: "-", pBDyn: "-", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "25", brand: "Audi", model: "A4-S4-RS4 (Avant), Allroad", code: "B9", years: "2015-2019", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "900 zł", pBDyn: "900 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "26", brand: "Audi", model: "A4-S4", code: "B9", years: "2015-2019", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "900 zł", pBDyn: "900 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "27", brand: "Audi", model: "A4-S4-RS4 (Avant), Allroad", code: "B9 (Lift)", years: "2019-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 590 zł", pBDyn: "1 590 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "28", brand: "Audi", model: "A4-S4", code: "B9 (Lift)", years: "2019-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 590 zł", pBDyn: "1 590 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "29", brand: "Audi", model: "A5, S5, RS5", code: "8T (Lift)", years: "2011-2016", staticVer: "Statyczna", pCStat: "800 zł", pBStat: "800 zł", dynVer: "Dynamiczna", pCDyn: "1 400 zł", pBDyn: "1 400 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "30", brand: "Audi", model: "A5, S5, RS5", code: "F5 (przed lift)", years: "2017-2020", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "900 zł", pBDyn: "900 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "31", brand: "Audi", model: "A5, S5, RS5", code: "F5 (Lift)", years: "2019-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 590 zł", pBDyn: "1 590 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "32", brand: "Audi", model: "A6-S6-RS6 (Avant), Allroad", code: "C7 (przed lift)", years: "2011-2014", staticVer: "Statyczna", pCStat: "890 zł", pBStat: "890 zł", dynVer: "Dynamiczna", pCDyn: "1 490 zł", pBDyn: "1 490 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "33", brand: "Audi", model: "A6-S6-RS6 (Avant), Allroad", code: "C7 (Lift)", years: "2014-2017", staticVer: "Statyczna", pCStat: "900 zł", pBStat: "900 zł", dynVer: "Dynamiczna", pCDyn: "1 500 zł", pBDyn: "1 500 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "34", brand: "Audi", model: "A6-S6-RS6 (Avant), Allroad", code: "C8 (OPTI)", years: "2018-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "35", brand: "Audi", model: "A6-S6-RS6 (Avant), Allroad", code: "C8 (OPTII)", years: "2018-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 490 zł", pBDyn: "1 490 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "36", brand: "Audi", model: "A7-S7-RS7 (Sportback)", code: "C7/4G (przed lift)", years: "2010-2014", staticVer: "Statyczna", pCStat: "890 zł", pBStat: "890 zł", dynVer: "Dynamiczna", pCDyn: "1 490 zł", pBDyn: "1 490 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "37", brand: "Audi", model: "A7-S7-RS7 (Sportback)", code: "C7/4G (Lift)", years: "2014-2017", staticVer: "Statyczna", pCStat: "1 190 zł", pBStat: "1 190 zł", dynVer: "Dynamiczna", pCDyn: "1 690 zł", pBDyn: "1 690 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "38", brand: "Audi", model: "A7-S7-RS7 (Sportback)", code: "C8", years: "2017-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 390 zł", pBDyn: "1 390 zł", install: "Tak", coding: "Tak", lamps: "3" },
  { lp: "39", brand: "Audi", model: "A8", code: "D3 (Lift)", years: "2006-2010", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 290 zł", pBDyn: "1 290 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "40", brand: "Audi", model: "A8, S8", code: "D4 (przed lift)", years: "2010-2013", staticVer: "Statyczna", pCStat: "990 zł", pBStat: "990 zł", dynVer: "Dynamiczna", pCDyn: "1 590 zł", pBDyn: "1 590 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "41", brand: "Audi", model: "A8, S8", code: "D4 (Lift)", years: "2013-2017", staticVer: "Statyczna", pCStat: "1 190 zł", pBStat: "1 190 zł", dynVer: "Dynamiczna", pCDyn: "1 690 zł", pBDyn: "1 690 zł", install: "Nie", coding: "Tak", lamps: "4" },
  { lp: "42", brand: "Audi", model: "A8, S8", code: "D5", years: "2017-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 390 zł", pBDyn: "1 390 zł", install: "Nie", coding: "Tak", lamps: "3" },
  { lp: "43", brand: "Audi", model: "Q3, RSQ3", code: "I-gen (przed lift)", years: "2011-2015", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "44", brand: "Audi", model: "Q3, RSQ3", code: "I-gen (Lift)", years: "2015-2018", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "45", brand: "Audi", model: "Q3, RSQ3, Sportback", code: "II-gen", years: "2018-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 090 zł", pBDyn: "1 090 zł", install: "Tak", coding: "Tak", lamps: "4" },
  { lp: "46", brand: "Audi", model: "Q4 E-Tron", code: "-", years: "-", staticVer: "Nie da się przerobić", pCStat: "-", pBStat: "-", dynVer: "Nie da się przerobić", pCDyn: "-", pBDyn: "-", install: "Tak", coding: "Tak", lamps: "-" },
  
  // Audi Q5 / SQ5 Variants - exactly as in master table!
  { lp: "47", brand: "Audi", model: "Q5, SQ5", code: "8R (Lift)", years: "2012-2016", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "48", brand: "Audi", model: "Q5, SQ5", code: "80A/FY (przed lift)", years: "2017-2020", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "-", pCDyn: "690 zł", pBDyn: "690 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "49", brand: "Audi", model: "Q5-SQ5 (Sportback)", code: "80A/FY(Lift)", years: "2020-2024", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 390 zł", pBDyn: "-", install: "Tak", coding: "Tak", lamps: "2" },
  { lp: "50", brand: "Audi", model: "Q5-SQ5 (Sportback)", code: "80A/FY(Lift)", years: "2022-2024", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna (OLED)", pCDyn: "1 690 zł", pBDyn: "-", install: "Tak", coding: "Tak", lamps: "2" },
  { lp: "51", brand: "Audi", model: "Q5-SQ5 (Sportback)", code: "GU", years: "2024-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 790 zł", pBDyn: "1 790 zł", install: "Nie", coding: "Tak", lamps: "2 + blenda" },
  { lp: "52", brand: "Audi", model: "Q5-SQ5 (Sportback)", code: "GU", years: "2024-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna (OLED)", pCDyn: "1 790 zł", pBDyn: "1 790 zł", install: "Nie", coding: "Tak", lamps: "2 + blenda" },

  // Audi Q7 / Q8 / e-tron / TT / R8
  { lp: "53", brand: "Audi", model: "Q7", code: "4L (Lift)", years: "2009-2015", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "54", brand: "Audi", model: "Q7, SQ7", code: "4M (przed lift)", years: "2015-2019", staticVer: "Statyczna", pCStat: "690 zł", pBStat: "690 zł", dynVer: "Dynamiczna", pCDyn: "1 190 zł", pBDyn: "1 190 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "55", brand: "Audi", model: "Q7, SQ7", code: "4M (Lift I)", years: "2019-2024", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 390 zł", pBDyn: "1 390 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "56", brand: "Audi", model: "Q7, SQ7", code: "4M OLED (Lift II)", years: "2024-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 890 zł", pBDyn: "1 890 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "57", brand: "Audi", model: "Q8, SQ8, RSQ8", code: "-", years: "2018-", staticVer: "Statyczna", pCStat: "1 800 zł", pBStat: "1 800 zł", dynVer: "Dynamiczna", pCDyn: "2 400 zł", pBDyn: "2 400 zł", install: "Tak", coding: "Tak", lamps: "3" },
  { lp: "58", brand: "Audi", model: "Q8, SQ8, RSQ9", code: "Lift", years: "2024-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "3 000 zł", pBDyn: "3 000 zł", install: "Tak", coding: "Tak", lamps: "2 + Blenda" },
  { lp: "59", brand: "Audi", model: "E-tron (Sportback-S)", code: "-", years: "2019-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 590 zł", pBDyn: "1 590 zł", install: "Tak", coding: "Tak", lamps: "3" },
  { lp: "60", brand: "Audi", model: "E-tron GT, RS", code: "-", years: "2021-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "2 400 zł", pBDyn: "2 400 zł", install: "Tak", coding: "Tak", lamps: "3" },
  { lp: "61", brand: "Audi", model: "TT, TTS, TTRS", code: "8S", years: "2014-2018", staticVer: "Statyczna", pCStat: "990 zł", pBStat: "990 zł", dynVer: "Dynamiczna", pCDyn: "1 490 zł", pBDyn: "1 490 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "62", brand: "Audi", model: "TT, TTS, TTRS (OLED)", code: "8S", years: "2014-2018", staticVer: "Statyczna", pCStat: "990 zł", pBStat: "990 zł", dynVer: "Dynamiczna", pCDyn: "1 490 zł", pBDyn: "1 490 zł", install: "Nie", coding: "Tak", lamps: "2" },
  { lp: "63", brand: "Audi", model: "R8", code: "I-gen (przed lift)", years: "2006-2015", staticVer: "Statyczna", pCStat: "1 290 zł", pBStat: "1 290 zł", dynVer: "Dynamiczna", pCDyn: "1 790 zł", pBDyn: "1 790 zł", install: "Tak", coding: "Tak", lamps: "2" },
  { lp: "64", brand: "Audi", model: "R8", code: "I-gen (Lift)", years: "2012-2015", staticVer: "Statyczna", pCStat: "1 290 zł", pBStat: "1 290 zł", dynVer: "Dynamiczna", pCDyn: "1 790 zł", pBDyn: "1 790 zł", install: "Tak", coding: "Tak", lamps: "2" },
  { lp: "65", brand: "Audi", model: "R8", code: "II-gen (przed lift)/(Lift)", years: "2015-2018/2018-", staticVer: "-", pCStat: "-", pBStat: "-", dynVer: "Dynamiczna", pCDyn: "1 390 zł", pBDyn: "1 390 zł", install: "Tak", coding: "Tak", lamps: "2" }
];

console.log('Sample rows count:', rawData.length);
