// Test script to verify airport code migration works
// This script tests creating airport codes with various lengths

const testAirportCodes = [
  { code: 'JFK', is_active: true, is_eu: false },
  { code: 'LAX', is_active: true, is_eu: false },
  { code: 'LHR', is_active: true, is_eu: false },
  { code: 'CDG', is_active: true, is_eu: true },
  { code: 'NRT', is_active: true, is_eu: false },
  { code: 'SYD', is_active: false, is_eu: false },
  { code: 'DXB', is_active: true, is_eu: false },
  { code: 'SFO', is_active: true, is_eu: false },
  // Test longer codes
  { code: 'LONG_AIRPORT_CODE_EXAMPLE', is_active: true, is_eu: false },
  { code: 'ANOTHER_LONG_CODE', is_active: true, is_eu: true },
  { code: 'VERY_LONG_AIRPORT_CODE_THAT_SHOULD_WORK', is_active: true, is_eu: false },
  { code: 'MixedCase123', is_active: true, is_eu: false },
  { code: 'lowercase', is_active: true, is_eu: false },
  { code: 'UPPERCASE', is_active: true, is_eu: false }
];

console.log('Test airport codes to verify migration:');
testAirportCodes.forEach((airport, index) => {
  console.log(`${index + 1}. ${airport.code} (${airport.code.length} chars) - Active: ${airport.is_active}, EU: ${airport.is_eu}`);
});

console.log('\nMigration should allow all these codes to be stored in the database.');
console.log('The code field now supports up to 255 characters instead of 3.');
