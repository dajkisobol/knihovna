import {
  toIsbn13,
  cleanPunctuation,
  parseAuthors,
  parseYear,
  parsePageCount,
  parseKnihovnyCzDescription,
  generateStructuredDetails
} from './bookService.js';

// Sample JSON response provided in instructions
const SAMPLE_RESPONSE = {
  "resultCount": 1,
  "records": [{
    "id": "mkp.3521868",
    "title": "Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença",
    "authors": {
      "primary": { "Jean de Nostredame, asi 1507-1577": [] },
      "secondary": { "Josef Prokop, 1971-": [], "Vojtěch Domlátil, 1979-": [] },
      "corporate": []
    },
    "publishers": ["Argo,"],
    "placesOfPublication": ["Praha :"],
    "publicationDates": ["2011"],
    "physicalDescriptions": ["218 s. : il. ; 22 cm"],
    "isbns": ["978-80-257-0367-0"],
    "issns": [],
    "cnb": "cnb002163342",
    "formats": ["0/BOOKS/"]
  }],
  "status": "OK"
};

function runTests() {
  console.log('Testing toIsbn13...');
  console.assert(toIsbn13('80-257-0367-7') === '9788025703670', 'ISBN-10 to ISBN-13 conversion failed');
  console.assert(toIsbn13('978-80-257-0367-0') === '9788025703670', 'ISBN-13 cleaning failed');

  console.log('Testing cleanPunctuation...');
  console.assert(cleanPunctuation('Argo,') === 'Argo', 'Publisher punctuation cleaning failed');
  console.assert(cleanPunctuation('Praha :') === 'Praha', 'Place punctuation cleaning failed');

  console.log('Testing parseAuthors...');
  const record = SAMPLE_RESPONSE.records[0];
  const authorsStr = parseAuthors(record.authors);
  console.assert(authorsStr === 'Jean de Nostredame, Josef Prokop, Vojtěch Domlátil', `Author parsing unexpected: "${authorsStr}"`);

  console.log('Testing parseYear...');
  console.assert(parseYear(record.publicationDates) === '2011', 'Year parsing failed');

  console.log('Testing parsePageCount...');
  console.assert(parsePageCount(record.physicalDescriptions) === 218, 'Page count parsing failed');

  console.log('Testing parseKnihovnyCzDescription...');
  const sampleMatchWithSummary = {
    summary: ['Historický román popisující životy provensálských básníků.']
  };
  const parsedDesc = parseKnihovnyCzDescription(sampleMatchWithSummary);
  console.assert(parsedDesc === 'Historický román popisující životy provensálských básníků.', 'parseKnihovnyCzDescription failed');

  console.log('Testing generateStructuredDetails...');
  const details = generateStructuredDetails(
    'Fascinující román o lásce a odvaze v historické Francii.',
    'Životy básníků',
    'Jean de Nostredame',
    'Historický román'
  );
  console.assert(details.description === 'Fascinující román o lásce a odvaze v historické Francii.', 'generateStructuredDetails description failed');
  console.assert(Array.isArray(details.mainIdeas) && details.mainIdeas.length > 0, 'generateStructuredDetails mainIdeas failed');
  console.assert(typeof details.characterNotes === 'string' && details.characterNotes.length > 0, 'generateStructuredDetails characterNotes failed');
  console.assert(typeof details.recommendation === 'string' && details.recommendation.length > 0, 'generateStructuredDetails recommendation failed');

  console.log('All bookService helper tests passed successfully!');
}

runTests();
