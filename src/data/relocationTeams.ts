  export type RelocationTeam = {
    id: string;
    city: string;
    name: string;
    fullName: string;
    pillars: string[];
    colors: string[];
    tone: string;
    designLanguage: string;
    iconography: string;
    typography: string;
    constraints: string[];
  };

  export const RELOCATION_TEAMS: RelocationTeam[] = [
  {
    "id": "SEA_SPEED",
    "city": "Seattle",
    "name": "Speed",
    "fullName": "Seattle Speed",
    "pillars": [
      "Speed",
      "Precision",
      "Relentless Pace"
    ],
    "colors": [
      "Emerald green",
      "Deep navy",
      "Silver accents"
    ],
    "tone": "Sharp, efficient, intimidating through tempo",
    "designLanguage": "Motion lines, aerodynamic forms, minimal curves",
    "iconography": "Slashes, streaks, implied motion (never cartoon lightning)",
    "typography": "Narrow, forward-leaning sans-serif; italicized numerals; diagonal cuts",
    "constraints": [
      "Not playful",
      "Not futuristic",
      "Speed as execution, not flash"
    ]
  },
  {
    "id": "HOU_FUEL",
    "city": "Houston",
    "name": "Fuel",
    "fullName": "Houston Fuel",
    "pillars": [
      "Power",
      "Heat",
      "Work"
    ],
    "colors": [
      "Columbia blue",
      "Oil red",
      "White"
    ],
    "tone": "Heavy, industrial, proud",
    "designLanguage": "Bold blocks, industrial symmetry",
    "iconography": "Abstract flames, pressure gauges, vertical pillars",
    "typography": "Classic athletic serif with industrial weight; large numerals",
    "constraints": [
      "Continuation, not cosplay",
      "Avoid cartoon flames/novelty"
    ]
  },
  {
    "id": "POR_PIONEERS",
    "city": "Portland",
    "name": "Pioneers",
    "fullName": "Portland Pioneers",
    "pillars": [
      "Exploration",
      "Grit",
      "Self-Reliance"
    ],
    "colors": [
      "Forest green",
      "Earth brown",
      "Parchment white"
    ],
    "tone": "Earnest, historical, disciplined",
    "designLanguage": "Heritage textures, restrained geometry",
    "iconography": "Compass points, wagon-wheel abstractions",
    "typography": "Heritage serif headlines; neutral sans body; slightly weathered but clean",
    "constraints": [
      "No nostalgia kitsch",
      "Must feel earned"
    ]
  },
  {
    "id": "TUL_TORNADOES",
    "city": "Tulsa",
    "name": "Tornadoes",
    "fullName": "Tulsa Tornadoes",
    "pillars": [
      "Force",
      "Momentum",
      "Disruption"
    ],
    "colors": [
      "Storm gray",
      "Electric teal",
      "White"
    ],
    "tone": "Violent motion, controlled chaos",
    "designLanguage": "Spiral motion, asymmetry, velocity",
    "iconography": "Funnel abstractions, wind shear lines",
    "typography": "Angular sans-serif with sharp terminals; motion cuts",
    "constraints": [
      "Avoid cartoon weather",
      "Dangerous not whimsical"
    ]
  },
  {
    "id": "LA_BLITZ",
    "city": "Los Angeles",
    "name": "Blitz",
    "fullName": "Los Angeles Blitz",
    "pillars": [
      "Speed",
      "Shock",
      "Precision"
    ],
    "colors": [
      "Black",
      "Neon gold",
      "White"
    ],
    "tone": "High-energy, aggressive, media-ready",
    "designLanguage": "Sharp angles, high contrast, cinematic lighting",
    "iconography": "Lightning abstractions, diagonal strikes",
    "typography": "Condensed modern sans; aggressive kerning; vertical compression",
    "constraints": [
      "Distinct from LA Stars (prestige)",
      "Blitz = impact"
    ]
  },
  {
    "id": "NJ_GENERALS",
    "city": "New Jersey",
    "name": "Generals",
    "fullName": "New Jersey Generals",
    "pillars": [
      "Leadership",
      "Order",
      "Tradition"
    ],
    "colors": [
      "Red",
      "Navy",
      "White"
    ],
    "tone": "Formal, resolute, disciplined",
    "designLanguage": "Symmetry, stars, clean heraldry",
    "iconography": "Chevrons, banners, shields",
    "typography": "Classical serif headlines; conservative sans body",
    "constraints": [
      "Governmental not militaristic cosplay",
      "No parody patriotism"
    ]
  },
  {
    "id": "RIC_RIVERMEN",
    "city": "Richmond",
    "name": "Rivermen",
    "fullName": "Richmond Rivermen",
    "pillars": [
      "Flow",
      "Strength",
      "Continuity"
    ],
    "colors": [
      "River blue",
      "Steel gray",
      "Sand"
    ],
    "tone": "Calm, forceful, grounded",
    "designLanguage": "Horizontal movement, layered depth",
    "iconography": "Currents, hull lines, docks",
    "typography": "Humanist sans; rounded but strong letterforms",
    "constraints": [
      "Avoid rustic/collegiate",
      "Professional physical identity"
    ]
  },
  {
    "id": "IOW_OXEN",
    "city": "Iowa",
    "name": "Oxen",
    "fullName": "Iowa Oxen",
    "pillars": [
      "Strength",
      "Labor",
      "Endurance"
    ],
    "colors": [
      "Deep brown",
      "Cream",
      "Black"
    ],
    "tone": "Brutal, honest, relentless",
    "designLanguage": "Heavy massing, thick strokes",
    "iconography": "Horn shapes, yokes, plow geometry",
    "typography": "Ultra-bold slab serif or block sans; thick numerals",
    "constraints": [
      "No cartoon animal faces",
      "Force not cuteness"
    ]
  },
  {
    "id": "OAK_OVERLOAD",
    "city": "Oakland",
    "name": "Overload",
    "fullName": "Oakland Overload",
    "pillars": [
      "Power",
      "Pressure",
      "Endurance",
      "Urban Industry"
    ],
    "colors": [
      "Black",
      "High-voltage yellow",
      "Steel gray"
    ],
    "tone": "Relentless, modern, intimidating",
    "designLanguage": "Dense layering, signal noise, industrial grids",
    "iconography": "Voltage arcs, circuit abstractions, load meters",
    "typography": "Brutalist sans; squared geometry; high legibility",
    "constraints": [
      "No outlaw imagery",
      "Infrastructure-level power"
    ]
  }
];
