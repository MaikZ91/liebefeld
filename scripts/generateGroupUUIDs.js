
// Run with: node scripts/generateGroupUUIDs.js
import { v5 as uuidv5 } from 'uuid';

const TRIBE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const categories = ['Kreativität', 'Ausgehen', 'Sport'];
const cities = [
  { abbr: 'BI', name: 'Bielefeld' },
  { abbr: 'berlin', name: 'Berlin' },
  { abbr: 'bremen', name: 'Bremen' },
  { abbr: 'dortmund', name: 'Dortmund' },
  { abbr: 'dresden', name: 'Dresden' },
  { abbr: 'duesseldorf', name: 'Düsseldorf' },
  { abbr: 'essen', name: 'Essen' },
  { abbr: 'frankfurt', name: 'Frankfurt' },
  { abbr: 'hamburg', name: 'Hamburg' },
  { abbr: 'hanover', name: 'Hannover' },
  { abbr: 'cologne', name: 'Köln' },
  { abbr: 'leipzig', name: 'Leipzig' },
  { abbr: 'luebeck', name: 'Lübeck' },
  { abbr: 'munich', name: 'München' },
  { abbr: 'muenster', name: 'Münster' },
  { abbr: 'nuremberg', name: 'Nürnberg' },
  { abbr: 'stuttgart', name: 'Stuttgart' },
];

function getGroupId(category, abbr) {
  return uuidv5(`${abbr.toLowerCase()}_${category.toLowerCase()}`, TRIBE_NAMESPACE);
}

for (const city of cities) {
  for (const category of categories) {
    const uuid = getGroupId(category, city.abbr);
    console.log(`[${city.name}] [${category}]: ${uuid}`);
  }
}
