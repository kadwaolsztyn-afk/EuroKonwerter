const fs = require('fs');
const path = require('path');
const { MODELS_DATA } = require('./models-dataset.cjs');

console.log(`Generating catalog with ${MODELS_DATA.length} models across 35 brands...`);

// SVGs for lamps
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

const uniqueBrands = Array.from(new Set(MODELS_DATA.map(m => m.brand)));

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

const rows = MODELS_DATA.map((item, index) => {
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
  name: 'Baza Pojazdów USA/EU (35 Marek)',
  fileType: 'sample',
  sizeFormatted: '254 KB',
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
console.log('Successfully wrote data-catalog.json with full DocumentRow schema!');

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

