export type Hometown = {
  id: string;
  label: string; // e.g. "Montgomery, AL"
  state: string; // full state name
  city: string;
  abbr: string; // state abbreviation
};

export const HOMETOWNS: readonly Hometown[] = [
  { id: "AL_MONTGOMERY", label: "Montgomery, AL", state: "Alabama", city: "Montgomery", abbr: "AL" },

  { id: "AK_ANCHORAGE", label: "Anchorage, AK", state: "Alaska", city: "Anchorage", abbr: "AK" },
  { id: "AK_JUNEAU", label: "Juneau, AK", state: "Alaska", city: "Juneau", abbr: "AK" },

  { id: "AZ_CHANDLER", label: "Chandler, AZ", state: "Arizona", city: "Chandler", abbr: "AZ" },
  { id: "AZ_GILBERT", label: "Gilbert, AZ", state: "Arizona", city: "Gilbert", abbr: "AZ" },
  { id: "AZ_GLENDALE", label: "Glendale, AZ", state: "Arizona", city: "Glendale", abbr: "AZ" },
  { id: "AZ_MESA", label: "Mesa, AZ", state: "Arizona", city: "Mesa", abbr: "AZ" },
  { id: "AZ_PHOENIX", label: "Phoenix, AZ", state: "Arizona", city: "Phoenix", abbr: "AZ" },
  { id: "AZ_SCOTTSDALE", label: "Scottsdale, AZ", state: "Arizona", city: "Scottsdale", abbr: "AZ" },
  { id: "AZ_TUCSON", label: "Tucson, AZ", state: "Arizona", city: "Tucson", abbr: "AZ" },

  { id: "AR_LITTLE_ROCK", label: "Little Rock, AR", state: "Arkansas", city: "Little Rock", abbr: "AR" },

  { id: "CA_ANAHEIM", label: "Anaheim, CA", state: "California", city: "Anaheim", abbr: "CA" },
  { id: "CA_BAKERSFIELD", label: "Bakersfield, CA", state: "California", city: "Bakersfield", abbr: "CA" },
  { id: "CA_CHULA_VISTA", label: "Chula Vista, CA", state: "California", city: "Chula Vista", abbr: "CA" },
  { id: "CA_FRESNO", label: "Fresno, CA", state: "California", city: "Fresno", abbr: "CA" },
  { id: "CA_IRVINE", label: "Irvine, CA", state: "California", city: "Irvine", abbr: "CA" },
  { id: "CA_LONG_BEACH", label: "Long Beach, CA", state: "California", city: "Long Beach", abbr: "CA" },
  { id: "CA_LOS_ANGELES", label: "Los Angeles, CA", state: "California", city: "Los Angeles", abbr: "CA" },
  { id: "CA_OAKLAND", label: "Oakland, CA", state: "California", city: "Oakland", abbr: "CA" },
  { id: "CA_RIVERSIDE", label: "Riverside, CA", state: "California", city: "Riverside", abbr: "CA" },
  { id: "CA_SACRAMENTO", label: "Sacramento, CA", state: "California", city: "Sacramento", abbr: "CA" },
  { id: "CA_SAN_DIEGO", label: "San Diego, CA", state: "California", city: "San Diego", abbr: "CA" },
  { id: "CA_SAN_FRANCISCO", label: "San Francisco, CA", state: "California", city: "San Francisco", abbr: "CA" },
  { id: "CA_SAN_JOSE", label: "San Jose, CA", state: "California", city: "San Jose", abbr: "CA" },
  { id: "CA_SANTA_ANA", label: "Santa Ana, CA", state: "California", city: "Santa Ana", abbr: "CA" },
  { id: "CA_STOCKTON", label: "Stockton, CA", state: "California", city: "Stockton", abbr: "CA" },

  { id: "CO_AURORA", label: "Aurora, CO", state: "Colorado", city: "Aurora", abbr: "CO" },
  { id: "CO_COLORADO_SPRINGS", label: "Colorado Springs, CO", state: "Colorado", city: "Colorado Springs", abbr: "CO" },
  { id: "CO_DENVER", label: "Denver, CO", state: "Colorado", city: "Denver", abbr: "CO" },

  { id: "CT_HARTFORD", label: "Hartford, CT", state: "Connecticut", city: "Hartford", abbr: "CT" },

  { id: "DE_DOVER", label: "Dover, DE", state: "Delaware", city: "Dover", abbr: "DE" },

  { id: "FL_JACKSONVILLE", label: "Jacksonville, FL", state: "Florida", city: "Jacksonville", abbr: "FL" },
  { id: "FL_MIAMI", label: "Miami, FL", state: "Florida", city: "Miami", abbr: "FL" },
  { id: "FL_ORLANDO", label: "Orlando, FL", state: "Florida", city: "Orlando", abbr: "FL" },
  { id: "FL_ST_PETERSBURG", label: "St. Petersburg, FL", state: "Florida", city: "St. Petersburg", abbr: "FL" },
  { id: "FL_TALLAHASSEE", label: "Tallahassee, FL", state: "Florida", city: "Tallahassee", abbr: "FL" },
  { id: "FL_TAMPA", label: "Tampa, FL", state: "Florida", city: "Tampa", abbr: "FL" },

  { id: "GA_ATLANTA", label: "Atlanta, GA", state: "Georgia", city: "Atlanta", abbr: "GA" },

  { id: "HI_HONOLULU", label: "Honolulu, HI", state: "Hawaii", city: "Honolulu", abbr: "HI" },

  { id: "ID_BOISE", label: "Boise, ID", state: "Idaho", city: "Boise", abbr: "ID" },

  { id: "IL_CHICAGO", label: "Chicago, IL", state: "Illinois", city: "Chicago", abbr: "IL" },
  { id: "IL_SPRINGFIELD", label: "Springfield, IL", state: "Illinois", city: "Springfield", abbr: "IL" },

  { id: "IN_FORT_WAYNE", label: "Fort Wayne, IN", state: "Indiana", city: "Fort Wayne", abbr: "IN" },
  { id: "IN_INDIANAPOLIS", label: "Indianapolis, IN", state: "Indiana", city: "Indianapolis", abbr: "IN" },

  { id: "IA_DES_MOINES", label: "Des Moines, IA", state: "Iowa", city: "Des Moines", abbr: "IA" },

  { id: "KS_TOPEKA", label: "Topeka, KS", state: "Kansas", city: "Topeka", abbr: "KS" },
  { id: "KS_WICHITA", label: "Wichita, KS", state: "Kansas", city: "Wichita", abbr: "KS" },

  { id: "KY_FRANKFORT", label: "Frankfort, KY", state: "Kentucky", city: "Frankfort", abbr: "KY" },
  { id: "KY_LEXINGTON", label: "Lexington, KY", state: "Kentucky", city: "Lexington", abbr: "KY" },
  { id: "KY_LOUISVILLE", label: "Louisville, KY", state: "Kentucky", city: "Louisville", abbr: "KY" },

  { id: "LA_BATON_ROUGE", label: "Baton Rouge, LA", state: "Louisiana", city: "Baton Rouge", abbr: "LA" },
  { id: "LA_NEW_ORLEANS", label: "New Orleans, LA", state: "Louisiana", city: "New Orleans", abbr: "LA" },

  { id: "ME_AUGUSTA", label: "Augusta, ME", state: "Maine", city: "Augusta", abbr: "ME" },

  { id: "MD_ANNAPOLIS", label: "Annapolis, MD", state: "Maryland", city: "Annapolis", abbr: "MD" },

  { id: "MA_BOSTON", label: "Boston, MA", state: "Massachusetts", city: "Boston", abbr: "MA" },

  { id: "MI_DETROIT", label: "Detroit, MI", state: "Michigan", city: "Detroit", abbr: "MI" },
  { id: "MI_LANSING", label: "Lansing, MI", state: "Michigan", city: "Lansing", abbr: "MI" },

  { id: "MN_MINNEAPOLIS", label: "Minneapolis, MN", state: "Minnesota", city: "Minneapolis", abbr: "MN" },
  { id: "MN_SAINT_PAUL", label: "Saint Paul, MN", state: "Minnesota", city: "Saint Paul", abbr: "MN" },

  { id: "MS_JACKSON", label: "Jackson, MS", state: "Mississippi", city: "Jackson", abbr: "MS" },

  { id: "MO_JEFFERSON_CITY", label: "Jefferson City, MO", state: "Missouri", city: "Jefferson City", abbr: "MO" },
  { id: "MO_KANSAS_CITY", label: "Kansas City, MO", state: "Missouri", city: "Kansas City", abbr: "MO" },
  { id: "MO_ST_LOUIS", label: "St. Louis, MO", state: "Missouri", city: "St. Louis", abbr: "MO" },

  { id: "MT_HELENA", label: "Helena, MT", state: "Montana", city: "Helena", abbr: "MT" },

  { id: "NE_LINCOLN", label: "Lincoln, NE", state: "Nebraska", city: "Lincoln", abbr: "NE" },
  { id: "NE_OMAHA", label: "Omaha, NE", state: "Nebraska", city: "Omaha", abbr: "NE" },

  { id: "NV_CARSON_CITY", label: "Carson City, NV", state: "Nevada", city: "Carson City", abbr: "NV" },
  { id: "NV_HENDERSON", label: "Henderson, NV", state: "Nevada", city: "Henderson", abbr: "NV" },
  { id: "NV_LAS_VEGAS", label: "Las Vegas, NV", state: "Nevada", city: "Las Vegas", abbr: "NV" },
  { id: "NV_RENO", label: "Reno, NV", state: "Nevada", city: "Reno", abbr: "NV" },

  { id: "NH_CONCORD", label: "Concord, NH", state: "New Hampshire", city: "Concord", abbr: "NH" },

  { id: "NJ_NEWARK", label: "Newark, NJ", state: "New Jersey", city: "Newark", abbr: "NJ" },
  { id: "NJ_TRENTON", label: "Trenton, NJ", state: "New Jersey", city: "Trenton", abbr: "NJ" },

  { id: "NM_ALBUQUERQUE", label: "Albuquerque, NM", state: "New Mexico", city: "Albuquerque", abbr: "NM" },
  { id: "NM_SANTA_FE", label: "Santa Fe, NM", state: "New Mexico", city: "Santa Fe", abbr: "NM" },

  { id: "NY_ALBANY", label: "Albany, NY", state: "New York", city: "Albany", abbr: "NY" },
  { id: "NY_BUFFALO", label: "Buffalo, NY", state: "New York", city: "Buffalo", abbr: "NY" },
  { id: "NY_NEW_YORK", label: "New York, NY", state: "New York", city: "New York", abbr: "NY" },

  { id: "NC_CHARLOTTE", label: "Charlotte, NC", state: "North Carolina", city: "Charlotte", abbr: "NC" },
  { id: "NC_DURHAM", label: "Durham, NC", state: "North Carolina", city: "Durham", abbr: "NC" },
  { id: "NC_GREENSBORO", label: "Greensboro, NC", state: "North Carolina", city: "Greensboro", abbr: "NC" },
  { id: "NC_RALEIGH", label: "Raleigh, NC", state: "North Carolina", city: "Raleigh", abbr: "NC" },
  { id: "NC_WINSTON_SALEM", label: "Winston-Salem, NC", state: "North Carolina", city: "Winston-Salem", abbr: "NC" },

  { id: "ND_BISMARCK", label: "Bismarck, ND", state: "North Dakota", city: "Bismarck", abbr: "ND" },

  { id: "OH_CINCINNATI", label: "Cincinnati, OH", state: "Ohio", city: "Cincinnati", abbr: "OH" },
  { id: "OH_COLUMBUS", label: "Columbus, OH", state: "Ohio", city: "Columbus", abbr: "OH" },
  { id: "OH_TOLEDO", label: "Toledo, OH", state: "Ohio", city: "Toledo", abbr: "OH" },

  { id: "OK_OKLAHOMA_CITY", label: "Oklahoma City, OK", state: "Oklahoma", city: "Oklahoma City", abbr: "OK" },
  { id: "OK_TULSA", label: "Tulsa, OK", state: "Oklahoma", city: "Tulsa", abbr: "OK" },

  { id: "OR_PORTLAND", label: "Portland, OR", state: "Oregon", city: "Portland", abbr: "OR" },
  { id: "OR_SALEM", label: "Salem, OR", state: "Oregon", city: "Salem", abbr: "OR" },

  { id: "PA_HARRISBURG", label: "Harrisburg, PA", state: "Pennsylvania", city: "Harrisburg", abbr: "PA" },
  { id: "PA_PHILADELPHIA", label: "Philadelphia, PA", state: "Pennsylvania", city: "Philadelphia", abbr: "PA" },

  { id: "RI_PROVIDENCE", label: "Providence, RI", state: "Rhode Island", city: "Providence", abbr: "RI" },

  { id: "SC_COLUMBIA", label: "Columbia, SC", state: "South Carolina", city: "Columbia", abbr: "SC" },

  { id: "SD_PIERRE", label: "Pierre, SD", state: "South Dakota", city: "Pierre", abbr: "SD" },

  { id: "TN_MEMPHIS", label: "Memphis, TN", state: "Tennessee", city: "Memphis", abbr: "TN" },
  { id: "TN_NASHVILLE", label: "Nashville, TN", state: "Tennessee", city: "Nashville", abbr: "TN" },

  { id: "TX_ARLINGTON", label: "Arlington, TX", state: "Texas", city: "Arlington", abbr: "TX" },
  { id: "TX_CORPUS_CHRISTI", label: "Corpus Christi, TX", state: "Texas", city: "Corpus Christi", abbr: "TX" },
  { id: "TX_DALLAS", label: "Dallas, TX", state: "Texas", city: "Dallas", abbr: "TX" },
  { id: "TX_FORT_WORTH", label: "Fort Worth, TX", state: "Texas", city: "Fort Worth", abbr: "TX" },
  { id: "TX_HOUSTON", label: "Houston, TX", state: "Texas", city: "Houston", abbr: "TX" },
  { id: "TX_LAREDO", label: "Laredo, TX", state: "Texas", city: "Laredo", abbr: "TX" },
  { id: "TX_PLANO", label: "Plano, TX", state: "Texas", city: "Plano", abbr: "TX" },
  { id: "TX_SAN_ANTONIO", label: "San Antonio, TX", state: "Texas", city: "San Antonio", abbr: "TX" },

  { id: "UT_SALT_LAKE_CITY", label: "Salt Lake City, UT", state: "Utah", city: "Salt Lake City", abbr: "UT" },

  { id: "VT_MONTPELIER", label: "Montpelier, VT", state: "Vermont", city: "Montpelier", abbr: "VT" },

  { id: "VA_CHESAPEAKE", label: "Chesapeake, VA", state: "Virginia", city: "Chesapeake", abbr: "VA" },
  { id: "VA_NORFOLK", label: "Norfolk, VA", state: "Virginia", city: "Norfolk", abbr: "VA" },
  { id: "VA_RICHMOND", label: "Richmond, VA", state: "Virginia", city: "Richmond", abbr: "VA" },
  { id: "VA_VIRGINIA_BEACH", label: "Virginia Beach, VA", state: "Virginia", city: "Virginia Beach", abbr: "VA" },

  { id: "WA_OLYMPIA", label: "Olympia, WA", state: "Washington", city: "Olympia", abbr: "WA" },
  { id: "WA_SEATTLE", label: "Seattle, WA", state: "Washington", city: "Seattle", abbr: "WA" },

  { id: "WV_CHARLESTON", label: "Charleston, WV", state: "West Virginia", city: "Charleston", abbr: "WV" },

  { id: "WI_MADISON", label: "Madison, WI", state: "Wisconsin", city: "Madison", abbr: "WI" },
  { id: "WI_MILWAUKEE", label: "Milwaukee, WI", state: "Wisconsin", city: "Milwaukee", abbr: "WI" },

  { id: "WY_CHEYENNE", label: "Cheyenne, WY", state: "Wyoming", city: "Cheyenne", abbr: "WY" },
] as const;

// TEAM_KEY values must match src/data/ugfTeams.ts keys.
// IMPORTANT: New Orleans must map to NEW_ORLEANS_HEX.
// IMPORTANT: New York must map to NEW_YORK_GOTHIC_GUARDIANS.

export const HOMETOWN_CLOSEST_TEAM: Readonly<Record<string, string>> = {
  AL_MONTGOMERY: "BIRMINGHAM_VULCANS",
  AK_ANCHORAGE: "SEATTLE_EVERGREENS",
  AK_JUNEAU: "SEATTLE_EVERGREENS",
  AZ_CHANDLER: "PHOENIX_SCORCH",
  AZ_GILBERT: "PHOENIX_SCORCH",
  AZ_GLENDALE: "PHOENIX_SCORCH",
  AZ_MESA: "PHOENIX_SCORCH",
  AZ_PHOENIX: "PHOENIX_SCORCH",
  AZ_SCOTTSDALE: "PHOENIX_SCORCH",
  AZ_TUCSON: "PHOENIX_SCORCH",
  AR_LITTLE_ROCK: "MEMPHIS_BLUES",
  CA_ANAHEIM: "LOS_ANGELES_STARS",
  CA_BAKERSFIELD: "LOS_ANGELES_STARS",
  CA_CHULA_VISTA: "SAN_DIEGO_ARMADA",
  CA_FRESNO: "LOS_ANGELES_STARS",
  CA_IRVINE: "LOS_ANGELES_STARS",
  CA_LONG_BEACH: "LOS_ANGELES_STARS",
  CA_LOS_ANGELES: "LOS_ANGELES_STARS",
  CA_OAKLAND: "LOS_ANGELES_STARS",
  CA_RIVERSIDE: "LOS_ANGELES_STARS",
  CA_SACRAMENTO: "LOS_ANGELES_STARS",
  CA_SAN_DIEGO: "SAN_DIEGO_ARMADA",
  CA_SAN_FRANCISCO: "LOS_ANGELES_STARS",
  CA_SAN_JOSE: "LOS_ANGELES_STARS",
  CA_SANTA_ANA: "LOS_ANGELES_STARS",
  CA_STOCKTON: "LOS_ANGELES_STARS",
  CO_AURORA: "DENVER_SUMMIT",
  CO_COLORADO_SPRINGS: "DENVER_SUMMIT",
  CO_DENVER: "DENVER_SUMMIT",
  CT_HARTFORD: "BOSTON_HARBORMEN",
  DE_DOVER: "PHILADELPHIA_FOUNDERS",
  FL_JACKSONVILLE: "JACKSONVILLE_FLEET",
  FL_MIAMI: "MIAMI_TIDE",
  FL_ORLANDO: "ORLANDO_KINGDOM",
  FL_ST_PETERSBURG: "ST_PETERSBURG_PELICANS",
  FL_TALLAHASSEE: "JACKSONVILLE_FLEET",
  FL_TAMPA: "ST_PETERSBURG_PELICANS",
  GA_ATLANTA: "ATLANTA_APEX",
  HI_HONOLULU: "LOS_ANGELES_STARS",
  ID_BOISE: "SEATTLE_EVERGREENS",
  IL_CHICAGO: "CHICAGO_UNION",
  IL_SPRINGFIELD: "CHICAGO_UNION",
  IN_FORT_WAYNE: "INDIANAPOLIS_CROSSROADS",
  IN_INDIANAPOLIS: "INDIANAPOLIS_CROSSROADS",
  IA_DES_MOINES: "CHICAGO_UNION",
  KS_TOPEKA: "DENVER_SUMMIT",
  KS_WICHITA: "DENVER_SUMMIT",
  KY_FRANKFORT: "INDIANAPOLIS_CROSSROADS",
  KY_LEXINGTON: "INDIANAPOLIS_CROSSROADS",
  KY_LOUISVILLE: "INDIANAPOLIS_CROSSROADS",
  LA_BATON_ROUGE: "NEW_ORLEANS_HEX",
  LA_NEW_ORLEANS: "NEW_ORLEANS_HEX",
  ME_AUGUSTA: "BOSTON_HARBORMEN",
  MD_ANNAPOLIS: "BALTIMORE_ADMIRALS",
  MA_BOSTON: "BOSTON_HARBORMEN",
  MI_DETROIT: "DETROIT_ASSEMBLY",
  MI_LANSING: "DETROIT_ASSEMBLY",
  MN_MINNEAPOLIS: "MILWAUKEE_NORTHSHORE",
  MN_SAINT_PAUL: "MILWAUKEE_NORTHSHORE",
  MS_JACKSON: "MEMPHIS_BLUES",
  MO_JEFFERSON_CITY: "ST_LOUIS_ARCHONS",
  MO_KANSAS_CITY: "ST_LOUIS_ARCHONS",
  MO_ST_LOUIS: "ST_LOUIS_ARCHONS",
  MT_HELENA: "DENVER_SUMMIT",
  NE_LINCOLN: "DENVER_SUMMIT",
  NE_OMAHA: "DENVER_SUMMIT",
  NV_CARSON_CITY: "LAS_VEGAS_SYNDICATE",
  NV_HENDERSON: "LAS_VEGAS_SYNDICATE",
  NV_LAS_VEGAS: "LAS_VEGAS_SYNDICATE",
  NV_RENO: "LAS_VEGAS_SYNDICATE",
  NH_CONCORD: "BOSTON_HARBORMEN",
  NJ_NEWARK: "NEW_YORK_GOTHIC_GUARDIANS",
  NJ_TRENTON: "PHILADELPHIA_FOUNDERS",
  NM_ALBUQUERQUE: "PHOENIX_SCORCH",
  NM_SANTA_FE: "PHOENIX_SCORCH",
  NY_ALBANY: "NEW_YORK_GOTHIC_GUARDIANS",
  NY_BUFFALO: "BUFFALO_NORTHWIND",
  NY_NEW_YORK: "NEW_YORK_GOTHIC_GUARDIANS",
  NC_CHARLOTTE: "CHARLOTTE_CROWN",
  NC_DURHAM: "CHARLOTTE_CROWN",
  NC_GREENSBORO: "CHARLOTTE_CROWN",
  NC_RALEIGH: "CHARLOTTE_CROWN",
  NC_WINSTON_SALEM: "CHARLOTTE_CROWN",
  ND_BISMARCK: "DENVER_SUMMIT",
  OH_CINCINNATI: "INDIANAPOLIS_CROSSROADS",
  OH_COLUMBUS: "CLEVELAND_FORGE",
  OH_TOLEDO: "DETROIT_ASSEMBLY",
  OK_OKLAHOMA_CITY: "DALLAS_IMPERIALS",
  OK_TULSA: "DALLAS_IMPERIALS",
  OR_PORTLAND: "SEATTLE_EVERGREENS",
  OR_SALEM: "SEATTLE_EVERGREENS",
  PA_HARRISBURG: "PHILADELPHIA_FOUNDERS",
  PA_PHILADELPHIA: "PHILADELPHIA_FOUNDERS",
  RI_PROVIDENCE: "BOSTON_HARBORMEN",
  SC_COLUMBIA: "CHARLOTTE_CROWN",
  SD_PIERRE: "DENVER_SUMMIT",
  TN_MEMPHIS: "MEMPHIS_BLUES",
  TN_NASHVILLE: "NASHVILLE_SOUND",
  TX_ARLINGTON: "DALLAS_IMPERIALS",
  TX_CORPUS_CHRISTI: "HOUSTON_LAUNCH",
  TX_DALLAS: "DALLAS_IMPERIALS",
  TX_FORT_WORTH: "DALLAS_IMPERIALS",
  TX_HOUSTON: "HOUSTON_LAUNCH",
  TX_LAREDO: "AUSTIN_EMPIRE", // spec note: "San Antonio (Austin Empire closest)"
  TX_PLANO: "DALLAS_IMPERIALS",
  TX_SAN_ANTONIO: "AUSTIN_EMPIRE",
  UT_SALT_LAKE_CITY: "DENVER_SUMMIT",
  VT_MONTPELIER: "BOSTON_HARBORMEN",
  VA_CHESAPEAKE: "WASHINGTON_SENTINELS",
  VA_NORFOLK: "WASHINGTON_SENTINELS",
  VA_RICHMOND: "WASHINGTON_SENTINELS",
  VA_VIRGINIA_BEACH: "WASHINGTON_SENTINELS",
  WA_OLYMPIA: "SEATTLE_EVERGREENS",
  WA_SEATTLE: "SEATTLE_EVERGREENS",
  WV_CHARLESTON: "PITTSBURGH_IRONCLADS",
  WI_MADISON: "MILWAUKEE_NORTHSHORE",
  WI_MILWAUKEE: "MILWAUKEE_NORTHSHORE",
  WY_CHEYENNE: "DENVER_SUMMIT",
} as const;
