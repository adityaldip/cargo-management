// Cargo routing and classification codes
export const CARGO_CODES = {
  // Airport and routing codes
  ROUTING_CODES: [
    "DKCPHA", "DKCPHB", "DKCPHC", "DKCPHP", "ISREKA", "SESTOK", "USEWRZ", 
    "USCHIX", "USLAXS", "SEARND", "SEMMAA", "SEMMAB", "SEMMAH", "SEMMAI", 
    "SEMMAC", "SEMMAF", "SEMMAQ", "SEMMAG", "NLHFDW", "NLHFDS", "NLHFDR",
    "NLHFDY", "NLHFDZ", "NLHFDX", "TWTPEB", "SESTOA", "FIHELZ", "SESTOD",
    "EETLLM", "NLSRKY", "LTKUNZ", "EELOOX", "EELOOY", "EELOOZ", "UZTASE",
    "DEROUX", "DEROUZ", "DEDIEY", "DEDIET", "DENIAA", "DEFRAA", "DEFRAB",
    "FIHELA", "EETLLT", "USEVIZ", "USSGVZ", "SJLYRA", "NOOSLZ", "HRZAG"
  ],

  // Country and region codes with wildcards
  COUNTRY_CODES: [
    "LV%", "TM%", "KG%", "BY%", "HR%", "MK%", "NL%", "HU%", "EEEAP%", 
    "EETLL%", "AZ%", "LT%", "BE%", "SGSIN%", "GRATH%", "USFRA%", 
    "USWAW%", "USTBS%", "USTLL%", "USHEL%", "USLON%", "USMAD%", "USRIX%", 
    "USVNO%", "USMLA%", "USOSL%", "USLJU%", "IT%", "VA%", "CH%", "NO%", 
    "UA%", "AT%", "ES%", "PLWAW%", "GB%", "AU%", "JE%", "IE%", "FR%", 
    "PT%", "CN%", "UZTAS%", "GE%", "IL%", "CZ%", "MD%", "USORD%", 
    "USJFK%", "USLAXA%", "ROBUH%", "JP%", "AM%", "MTMAR%"
  ],

  // Flight numbers and codes
  FLIGHT_CODES: [
    "BT620%", "BT733", "BT69%", "BT658%", "BT65%", "BT872%", "BT852%", 
    "BT854%", "BT612%", "BT478%", "BT274%", "BT68%", "BT846%", 
    "BT60%", "BT308", "BT326", "BT421%", "BT72%", "BT618%"
  ],

  // Mail categories and classifications
  MAIL_CATEGORIES: [
    "U%", "C%", "E%", "DE%", "MT%"
  ],

  // All codes combined for general search
  ALL_CODES: [] as string[]
}

// Combine all codes into one array for easy access and remove duplicates
CARGO_CODES.ALL_CODES = Array.from(new Set([
  ...CARGO_CODES.ROUTING_CODES,
  ...CARGO_CODES.COUNTRY_CODES,
  ...CARGO_CODES.FLIGHT_CODES,
  ...CARGO_CODES.MAIL_CATEGORIES
]))

// Helper functions
export const getCodesByType = (type: keyof typeof CARGO_CODES) => {
  return CARGO_CODES[type]
}

export const searchCodes = (query: string) => {
  return CARGO_CODES.ALL_CODES.filter(code => 
    code.toLowerCase().includes(query.toLowerCase())
  )
}
