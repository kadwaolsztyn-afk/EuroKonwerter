const fs = require('fs');
const path = require('path');

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

const rows = [
  {
    id: 1, lp: 1, brand: "Audi", model: "A6 / S6 / RS6", factoryCode: "C8 (4K)", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 800 zł", priceBrokerStatic: "1 440 zł",
    dynamicSignal: "Dynamiczny Matrix LED", priceClientDynamic: "2 600 zł", priceBrokerDynamic: "2 080 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: AUDI_LAMP
  },
  {
    id: 2, lp: 2, brand: "BMW", model: "Seria 5 / M5", factoryCode: "G30 / G31 LCI", years: "2020-2023",
    staticSignal: "Statyczny LED", priceClientStatic: "2 100 zł", priceBrokerStatic: "1 680 zł",
    dynamicSignal: "Dynamiczny Laser", priceClientDynamic: "3 200 zł", priceBrokerDynamic: "2 560 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: BMW_LAMP
  },
  {
    id: 3, lp: 3, brand: "Mercedes-Benz", model: "Klasa E", factoryCode: "W213 FL", years: "2020-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 950 zł", priceBrokerStatic: "1 560 zł",
    dynamicSignal: "Multibeam Dynamic", priceClientDynamic: "2 900 zł", priceBrokerDynamic: "2 320 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: MERC_LAMP
  },
  {
    id: 4, lp: 4, brand: "Porsche", model: "Panamera / Turbo", factoryCode: "971 FL", years: "2017-2023",
    staticSignal: "Statyczny LED", priceClientStatic: "2 800 zł", priceBrokerStatic: "2 240 zł",
    dynamicSignal: "PDLS+ Dynamic Matrix", priceClientDynamic: "4 200 zł", priceBrokerDynamic: "3 360 zł",
    installation: "TAK", coding: "W cenie", lampCount: "3 szt.", imageUrl: PORSCHE_LAMP
  },
  {
    id: 5, lp: 5, brand: "Ford", model: "Mustang GT / Mach 1", factoryCode: "S550 FL (USA -> EU)", years: "2018-2023",
    staticSignal: "Pomarańczowy Sekwencyjny", priceClientStatic: "1 500 zł", priceBrokerStatic: "1 200 zł",
    dynamicSignal: "Dynamiczny Płynny 3-Stripes", priceClientDynamic: "2 200 zł", priceBrokerDynamic: "1 760 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: FORD_LAMP
  },
  {
    id: 6, lp: 6, brand: "Dodge", model: "Challenger / Charger", factoryCode: "LD / LA (USA -> EU)", years: "2015-2023",
    staticSignal: "Konwersja Pomarańczowa", priceClientStatic: "1 400 zł", priceBrokerStatic: "1 120 zł",
    dynamicSignal: "Racetrack Dynamic Neo", priceClientDynamic: "2 400 zł", priceBrokerDynamic: "1 920 zł",
    installation: "TAK", coding: "W cenie", lampCount: "1 szt.", imageUrl: DODGE_LAMP
  },
  {
    id: 7, lp: 7, brand: "Jeep", model: "Grand Cherokee / Wrangler", factoryCode: "WK2 / JL (USA -> EU)", years: "2016-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 600 zł", priceBrokerStatic: "1 280 zł",
    dynamicSignal: "Dynamic LED Halo", priceClientDynamic: "2 300 zł", priceBrokerDynamic: "1 840 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: JEEP_LAMP
  },
  {
    id: 8, lp: 8, brand: "Chevrolet", model: "Corvette C8 / Camaro VI", factoryCode: "C8 / G6 (USA -> EU)", years: "2016-2024",
    staticSignal: "Statyczny Pomarańcz", priceClientStatic: "1 750 zł", priceBrokerStatic: "1 400 zł",
    dynamicSignal: "Dynamiczny Sekwencyjny", priceClientDynamic: "2 700 zł", priceBrokerDynamic: "2 160 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: CHEVROLET_LAMP
  },
  {
    id: 9, lp: 9, brand: "Cadillac", model: "Escalade / CT5", factoryCode: "GMT T1XX / CT5", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "2 200 zł", priceBrokerStatic: "1 760 zł",
    dynamicSignal: "Pionowy Dynamic Blade", priceClientDynamic: "3 400 zł", priceBrokerDynamic: "2 720 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: CADILLAC_LAMP
  },
  {
    id: 10, lp: 10, brand: "Volkswagen", model: "Golf VIII / Arteon / Touareg", factoryCode: "MK8 / 3H7 / CR7", years: "2019-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 500 zł", priceBrokerStatic: "1 200 zł",
    dynamicSignal: "IQ.Light Matrix Dynamic", priceClientDynamic: "2 400 zł", priceBrokerDynamic: "1 920 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: VW_LAMP
  },
  {
    id: 11, lp: 11, brand: "Skoda", model: "Superb III / Octavia IV / Kodiaq", factoryCode: "3V / NX / NS", years: "2019-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 400 zł", priceBrokerStatic: "1 120 zł",
    dynamicSignal: "Crystal Matrix Dynamic", priceClientDynamic: "2 100 zł", priceBrokerDynamic: "1 680 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: SKODA_LAMP
  },
  {
    id: 12, lp: 12, brand: "Cupra", model: "Formentor / Leon / Ateca", factoryCode: "KM7 / KL", years: "2020-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 550 zł", priceBrokerStatic: "1 240 zł",
    dynamicSignal: "Coast-to-Coast Dynamic", priceClientDynamic: "2 350 zł", priceBrokerDynamic: "1 880 zł",
    installation: "TAK", coding: "W cenie", lampCount: "3 szt.", imageUrl: CUPRA_LAMP
  },
  {
    id: 13, lp: 13, brand: "Volvo", model: "XC90 / XC60 / S90", factoryCode: "SPA Platform", years: "2016-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 850 zł", priceBrokerStatic: "1 480 zł",
    dynamicSignal: "Thor's Hammer Active High", priceClientDynamic: "2 750 zł", priceBrokerDynamic: "2 200 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: VOLVO_LAMP
  },
  {
    id: 14, lp: 14, brand: "Lexus", model: "RX / NX / ES / LC 500", factoryCode: "AL20 / AZ20 / XZ10", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 900 zł", priceBrokerStatic: "1 520 zł",
    dynamicSignal: "BladeScan Triple-Beam LED", priceClientDynamic: "3 100 zł", priceBrokerDynamic: "2 480 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: LEXUS_LAMP
  },
  {
    id: 15, lp: 15, brand: "Toyota", model: "RAV4 / Camry / Highlander", factoryCode: "XA50 / XV70 (USA -> EU)", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 350 zł", priceBrokerStatic: "1 080 zł",
    dynamicSignal: "Dynamic LED Sequential", priceClientDynamic: "1 950 zł", priceBrokerDynamic: "1 560 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: TOYOTA_LAMP
  },
  {
    id: 16, lp: 16, brand: "Mazda", model: "CX-5 / CX-30 / Mazda 6", factoryCode: "KF / DM / GL", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 400 zł", priceBrokerStatic: "1 120 zł",
    dynamicSignal: "KODO Dynamic Signature", priceClientDynamic: "2 100 zł", priceBrokerDynamic: "1 680 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: MAZDA_LAMP
  },
  {
    id: 17, lp: 17, brand: "Honda", model: "Civic X-XI / Accord X / CR-V", factoryCode: "FK / FL / CV (USA -> EU)", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 450 zł", priceBrokerStatic: "1 160 zł",
    dynamicSignal: "Jewel-Eye Dynamic LED", priceClientDynamic: "2 250 zł", priceBrokerDynamic: "1 800 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: HONDA_LAMP
  },
  {
    id: 18, lp: 18, brand: "Nissan", model: "GT-R R35 / 370Z / Patrol", factoryCode: "R35 / Z34 / Y62", years: "2014-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 700 zł", priceBrokerStatic: "1 360 zł",
    dynamicSignal: "Lightning LED Sequential", priceClientDynamic: "2 600 zł", priceBrokerDynamic: "2 080 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: NISSAN_LAMP
  },
  {
    id: 19, lp: 19, brand: "Infiniti", model: "Q50 / Q60 / QX60 / QX80", factoryCode: "V37 / CV37 (USA -> EU)", years: "2016-2023",
    staticSignal: "Statyczny LED", priceClientStatic: "1 650 zł", priceBrokerStatic: "1 320 zł",
    dynamicSignal: "Human-Eye Dynamic LED", priceClientDynamic: "2 450 zł", priceBrokerDynamic: "1 960 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: INFINITI_LAMP
  },
  {
    id: 20, lp: 20, brand: "Hyundai", model: "Tucson NX4 / Santa Fe / Ioniq 5", factoryCode: "NX4 / TM / NE", years: "2019-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 450 zł", priceBrokerStatic: "1 160 zł",
    dynamicSignal: "Parametric Pixel Dynamic", priceClientDynamic: "2 200 zł", priceBrokerDynamic: "1 760 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: HYUNDAI_LAMP
  },
  {
    id: 21, lp: 21, brand: "Kia", model: "Stinger / Sportage / EV6", factoryCode: "CK / NQ5 / CV", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 500 zł", priceBrokerStatic: "1 200 zł",
    dynamicSignal: "Star-Map Dynamic LED", priceClientDynamic: "2 300 zł", priceBrokerDynamic: "1 840 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: KIA_LAMP
  },
  {
    id: 22, lp: 22, brand: "Genesis", model: "G70 / G80 / GV70 / GV80", factoryCode: "IK / RG3 / JX1", years: "2020-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "2 100 zł", priceBrokerStatic: "1 680 zł",
    dynamicSignal: "Two-Lines Micro Lens Dynamic", priceClientDynamic: "3 300 zł", priceBrokerDynamic: "2 640 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: GENESIS_LAMP
  },
  {
    id: 23, lp: 23, brand: "Alfa Romeo", model: "Giulia / Stelvio / Tonale", factoryCode: "952 / 949 / 622", years: "2016-2024",
    staticSignal: "Statyczny Bi-Xenon/LED", priceClientStatic: "1 650 zł", priceBrokerStatic: "1 320 zł",
    dynamicSignal: "3+3 Full-LED Matrix Dynamic", priceClientDynamic: "2 650 zł", priceBrokerDynamic: "2 120 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: ALFA_LAMP
  },
  {
    id: 24, lp: 24, brand: "Maserati", model: "Ghibli / Levante / Grecale", factoryCode: "M157 / M161", years: "2016-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "2 400 zł", priceBrokerStatic: "1 920 zł",
    dynamicSignal: "Adaptive Full LED Matrix", priceClientDynamic: "3 600 zł", priceBrokerDynamic: "2 880 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: MASERATI_LAMP
  },
  {
    id: 25, lp: 25, brand: "Jaguar", model: "F-Type / F-Pace / XE", factoryCode: "X152 / X761", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 850 zł", priceBrokerStatic: "1 480 zł",
    dynamicSignal: "Double J-Blade Matrix Dynamic", priceClientDynamic: "2 900 zł", priceBrokerDynamic: "2 320 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: JAGUAR_LAMP
  },
  {
    id: 26, lp: 26, brand: "Land Rover", model: "Range Rover / Sport / Velar", factoryCode: "L405 / L494 / L560", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "2 100 zł", priceBrokerStatic: "1 680 zł",
    dynamicSignal: "Pixel-Laser LED Dynamic", priceClientDynamic: "3 500 zł", priceBrokerDynamic: "2 800 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: LANDROVER_LAMP
  },
  {
    id: 27, lp: 27, brand: "Aston Martin", model: "Vantage / DB11 / DBX", factoryCode: "AM6 / AM5", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "3 200 zł", priceBrokerStatic: "2 560 zł",
    dynamicSignal: "Full Matrix Dynamic Blade", priceClientDynamic: "4 800 zł", priceBrokerDynamic: "3 840 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: ASTON_LAMP
  },
  {
    id: 28, lp: 28, brand: "Bentley", model: "Continental GT / Bentayga", factoryCode: "3S / 4V", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "3 400 zł", priceBrokerStatic: "2 720 zł",
    dynamicSignal: "Crystal Cut Matrix LED", priceClientDynamic: "5 200 zł", priceBrokerDynamic: "4 160 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: BENTLEY_LAMP
  },
  {
    id: 29, lp: 29, brand: "Ferrari", model: "488 / F8 Tributo / Roma", factoryCode: "F142M / F164", years: "2016-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "3 600 zł", priceBrokerStatic: "2 880 zł",
    dynamicSignal: "Scuderia Dynamic Matrix", priceClientDynamic: "5 500 zł", priceBrokerDynamic: "4 400 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: FERRARI_LAMP
  },
  {
    id: 30, lp: 30, brand: "Lamborghini", model: "Urus / Huracan Evo", factoryCode: "ZL / LB724", years: "2017-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "3 800 zł", priceBrokerStatic: "3 040 zł",
    dynamicSignal: "Y-Shape Sequential Dynamic", priceClientDynamic: "5 600 zł", priceBrokerDynamic: "4 480 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: LAMBORGHINI_LAMP
  },
  {
    id: 31, lp: 31, brand: "Tesla", model: "Model 3 / Model Y / Model S", factoryCode: "Highland / Plaid", years: "2019-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 300 zł", priceBrokerStatic: "1 040 zł",
    dynamicSignal: "Dynamic Matrix Light Show", priceClientDynamic: "1 900 zł", priceBrokerDynamic: "1 520 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: TESLA_LAMP
  },
  {
    id: 32, lp: 32, brand: "Peugeot", model: "308 / 508 / 3008", factoryCode: "P5 / R8 / P84", years: "2019-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 350 zł", priceBrokerStatic: "1 080 zł",
    dynamicSignal: "3-Claws Matrix Dynamic", priceClientDynamic: "2 050 zł", priceBrokerDynamic: "1 640 zł",
    installation: "TAK", coding: "W cenie", lampCount: "4 szt.", imageUrl: PEUGEOT_LAMP
  },
  {
    id: 33, lp: 33, brand: "Renault", model: "Megane E-Tech / Austral / Talisman", factoryCode: "BCB / RHN", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 300 zł", priceBrokerStatic: "1 040 zł",
    dynamicSignal: "C-Shape Dynamic LED", priceClientDynamic: "1 950 zł", priceBrokerDynamic: "1 560 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: RENAULT_LAMP
  },
  {
    id: 34, lp: 34, brand: "Mini", model: "Cooper / JCW / Countryman", factoryCode: "F56 / F60 (USA -> EU)", years: "2018-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 400 zł", priceBrokerStatic: "1 120 zł",
    dynamicSignal: "Union Jack Dynamic LED", priceClientDynamic: "2 100 zł", priceBrokerDynamic: "1 680 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: MINI_LAMP
  },
  {
    id: 35, lp: 35, brand: "Subaru", model: "WRX STI / Outback / Forester", factoryCode: "VA / VB / SK (USA -> EU)", years: "2016-2024",
    staticSignal: "Statyczny LED", priceClientStatic: "1 450 zł", priceBrokerStatic: "1 160 zł",
    dynamicSignal: "C-Light Dynamic LED", priceClientDynamic: "2 250 zł", priceBrokerDynamic: "1 800 zł",
    installation: "TAK", coding: "W cenie", lampCount: "2 szt.", imageUrl: SUBARU_LAMP
  }
];

const document = {
  id: "master-cennik-35-marek",
  name: "Cennik_35_Marek_Pelna_Baza.xlsx",
  fileType: "sample",
  sizeFormatted: "148 KB",
  importedAt: new Date().toISOString(),
  rows,
  headers: [
    "LP.", "Marka", "Model", "Kod fabryczny", "Lata produkcji",
    "Wersja Kierunkowskazu (Statyczna)", "Cena klient (PLN)", "Cena broker (PLN)",
    "Wersja Kierunkowskazu (Dynamiczna)", "Cena klient (PLN)", "Cena broker (PLN)",
    "Instalacja", "Kodowanie", "Ilość lamp", "Zdjęcie lampy"
  ],
  columns: [
    { key: "lp", label: "LP." },
    { key: "brand", label: "Marka" },
    { key: "model", label: "Model" },
    { key: "factoryCode", label: "Kod fabryczny" },
    { key: "years", label: "Lata produkcji" },
    { key: "staticSignal", label: "Kierunkowskaz Statyczny" },
    { key: "priceClientStatic", label: "Cena klient (PLN)" },
    { key: "priceBrokerStatic", label: "Cena broker (PLN)" },
    { key: "dynamicSignal", label: "Kierunkowskaz Dynamiczny" },
    { key: "priceClientDynamic", label: "Cena klient (PLN)" },
    { key: "priceBrokerDynamic", label: "Cena broker (PLN)" },
    { key: "installation", label: "Instalacja" },
    { key: "coding", label: "Kodowanie" },
    { key: "lampCount", label: "Ilość lamp" },
    { key: "imageUrl", label: "Zdjęcie lampy" }
  ],
  images: rows.map((r, i) => ({
    id: `img-${i + 1}`,
    src: r.imageUrl,
    originalSrc: r.imageUrl,
    brand: r.brand,
    model: r.model,
    rowIndex: i,
    width: 200,
    height: 100
  })),
  totalRows: 35,
  brandsCount: 35,
  rawHtml: ''
};

const filePath = path.join(process.cwd(), 'data-catalog.json');
fs.writeFileSync(filePath, JSON.stringify(document, null, 2), 'utf-8');
console.log(`Saved 35 brands document to ${filePath}`);

const docForTs = { ...document };
delete docForTs.importedAt;

const initialCatalogTsContent = `import { ImportedDocument } from '../types';

export const INITIAL_35_BRANDS_DOCUMENT: ImportedDocument = {
  ...${JSON.stringify(docForTs, null, 2)},
  importedAt: new Date()
};

export const INITIAL_COMPREHENSIVE_CATALOG: ImportedDocument = INITIAL_35_BRANDS_DOCUMENT;
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/initialCatalog.ts'), initialCatalogTsContent, 'utf8');
console.log('Successfully wrote src/data/initialCatalog.ts with original 35 brands!');
