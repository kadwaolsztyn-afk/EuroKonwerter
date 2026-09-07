const fs = require('fs');

function getLampSvg(brand, model) {
  const brandColors = {
    'Audi': { stroke: '%2338bdf8', fill: '%230284c7', glow: '%23e0f2fe' },
    'BMW': { stroke: '%233b82f6', fill: '%231d4ed8', glow: '%2360a5fa' },
    'Mercedes': { stroke: '%23a855f7', fill: '%237e22ce', glow: '%23c084fc' },
    'Mercedes-Benz': { stroke: '%23a855f7', fill: '%237e22ce', glow: '%23c084fc' },
    'Porsche': { stroke: '%23ef4444', fill: '%23b91c1c', glow: '%23f87171' },
    'Ford': { stroke: '%230ea5e9', fill: '%230369a1', glow: '%2338bdf8' },
    'Jeep': { stroke: '%23eab308', fill: '%23a16207', glow: '%23fde047' },
    'Dodge': { stroke: '%23f97316', fill: '%23c2410c', glow: '%23fb923c' },
    'Chevrolet': { stroke: '%23f59e0b', fill: '%23b45309', glow: '%23fcd34d' },
    'Cadillac': { stroke: '%23e2e8f0', fill: '%23475569', glow: '%23cbd5e1' },
    'Volvo': { stroke: '%2306b6d4', fill: '%230891b2', glow: '%2367e8f9' },
    'Volkswagen': { stroke: '%233b82f6', fill: '%231e40af', glow: '%2393c5fd' },
    'Tesla': { stroke: '%23e11d48', fill: '%239f1239', glow: '%23fda4af' },
    'Toyota': { stroke: '%23dc2626', fill: '%23991b1b', glow: '%23fca5a5' }
  };

  const col = brandColors[brand] || { stroke: '%2338bdf8', fill: '%230284c7', glow: '%23e0f2fe' };
  const label = (brand + ' ' + model).slice(0, 24).toUpperCase();

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'><rect width='200' height='100' rx='8' fill='%230f172a'/><path d='M20 50 Q60 20 180 35 L160 75 Q70 70 20 50 Z' fill='%231e293b' stroke='${col.stroke}' stroke-width='2'/><circle cx='60' cy='48' r='14' fill='${col.fill}'/><circle cx='60' cy='48' r='8' fill='${col.glow}'/><path d='M90 42 L150 46 L145 58 L85 54 Z' fill='%23fbbf24'/><text x='100' y='88' font-family='Arial' font-size='9' fill='%2394a3b8' text-anchor='middle'>${label}</text></svg>`;
}

module.exports = { getLampSvg };
