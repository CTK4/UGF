export type PlayCall = {
  id: string;
  side: "OFF" | "DEF";
  system: string;
  full: string;
  alias: string;
  concept: string;
  installCost: number;
};

function costFromTokens(full: string): number {
  // Deterministic approximation from spec: sum parts
  // Why: We need stable complexity numbers now; we can refine parsing later.
  const s = full;
  let c = 0;
  if (s.includes("Motion") || s.includes("Jet") || s.includes("Orbit") || s.includes("Shift")) c += 1;
  if (s.includes("Scat") || s.includes("HalfSlide") || s.includes("PlayAction")) c += 2;
  // concept token is the last major token
  c += 3;
  // tags
  if (s.includes("Alert") || s.includes("Option") || s.includes("Read") || s.includes("Switch") || s.includes("Pivot")) c += 1;
  // formation/personal
  c += 2;
  return Math.max(3, Math.min(12, c));
}

function mkOff(id: string, alias: string, full: string, concept: string): PlayCall {
  return { id, side: "OFF", system: "GENERIC", full, alias, concept, installCost: costFromTokens(full) };
}
function mkDef(id: string, alias: string, full: string, concept: string): PlayCall {
  return { id, side: "DEF", system: "GENERIC", full, alias, concept, installCost: costFromTokens(full) };
}

export const OFF_CORE40: PlayCall[] = [
  mkOff("O1","11 Ace Zone Wide","[11] Ace Rt Far Y Inline 3 Zone Wide","Zone Wide"),
  mkOff("O2","11 Ace Zone Mid","[11] Ace Rt Far Y Inline 3 Zone Mid","Zone Mid"),
  mkOff("O3","12 Tight Split Zone","[12] Tight Lt Far Y Inline 3 Zone Split Slice","Zone Split"),
  mkOff("O4","21 I Strong Zone Weak","[21] I Strong Rt Near Y Inline Dot Zone Weak","Zone Weak"),
  mkOff("O5","11 Duo","[11] Ace Rt Far Y Inline 3 Duo","Duo"),
  mkOff("O6","21 Iso","[21] I Strong Lt Near Y Inline Dot Iso","Iso"),
  mkOff("O7","21 Counter","[21] Pro Rt Near Y Inline Dot Counter Pull","Counter"),
  mkOff("O8","11 Toss Crack","[11] Bunch Rt Far Y Slot 3 Toss Crack","Toss Crack"),
  mkOff("O9","11 Inside Zone","[11] Ace Rt Far Y Inline 3 Zone Inside","Zone Inside"),
  mkOff("O10","10 Spread Inside Zone","[10] Spread Rt Far Empty Scat InsideZone","InsideZone"),
  mkOff("O11","Boot Flood (Jet)","[11] Solo Rt Far Y Lt 3 PlayAction BootFlood Jet","BootFlood"),
  mkOff("O12","PA Yankee","[12] Tight Rt Near Y Inline 3 PlayAction Yankee","Yankee"),
  mkOff("O13","PA Sail","[11] Ace Rt Far Y Inline 3 PlayAction Sail","Sail"),
  mkOff("O14","Flood","[11] Bunch Rt Far Y Slot 3 Scat Flood","Flood"),
  mkOff("O15","Levels","[11] Ace Rt Far Y Inline 3 Scat Levels","Levels"),
  mkOff("O16","Cross","[11] Trips Lt Far Y Slot 3 Scat Cross","Cross"),
  mkOff("O17","Deep Over","[11] Solo Rt Far Y Lt 3 Scat DeepOver","DeepOver"),
  mkOff("O18","Curl Flat","[11] Ace Rt Far Y Inline 3 Scat CurlFlat","CurlFlat"),
  mkOff("O19","Dig","[11] Ace Rt Far Y Inline 3 Scat Dig","Dig"),
  mkOff("O20","Shallow","[11] Ace Rt Far Y Inline 3 Scat Shallow","Shallow"),
  mkOff("O21","Smash","[11] Bunch Lt Near Y Slot 3 Scat Smash","Smash"),
  mkOff("O22","Mesh","[10] Spread Rt Far Empty Scat Mesh","Mesh"),
  mkOff("O23","Y-Cross","[11] Trips Rt Far Y Slot 3 Scat YCross Option","YCross"),
  mkOff("O24","Stick","[10] Spread Rt Far Empty Scat Stick Now","Stick"),
  mkOff("O25","Four Verts","[10] Spread Rt Far Empty Scat FourVerts Switch","FourVerts"),
  mkOff("O26","RPO Slant","[11] Trips Rt Far Y Slot 3 RPO Slant Alert","RPO Slant"),
  mkOff("O27","RPO Bubble","[10] Spread Rt Far 2x2 Gun RPO Bubble Fast","RPO Bubble"),
  mkOff("O28","Read Zone","[10] Spread Rt Far 2x2 Gun ReadZone Keep","ReadZone"),
  mkOff("O29","Power Read","[10] Spread Lt Near 2x2 Gun PowerRead Give","PowerRead"),
  mkOff("O30","QB Draw","[11] Empty Rt Far Y Slot Empty Scat QB Draw","QB Draw"),
  mkOff("O31","RB Screen","[11] Ace Rt Far Y Inline 3 Screen RB","RB Screen"),
  mkOff("O32","WR Screen","[11] Trips Rt Far Y Slot 3 Screen WR","WR Screen"),
  mkOff("O33","TE Screen","[11] Ace Rt Far Y Inline 3 Screen TE","TE Screen"),
  mkOff("O34","Draw","[11] Ace Rt Far Y Inline 3 Draw","Draw"),
  mkOff("O35","Quick Swing","[10] Spread Rt Far Empty Scat Swing Now","Swing"),
  mkOff("O36","Texas","[11] Ace Rt Far Y Inline 3 HalfSlide Texas Check","Texas"),
  mkOff("O37","Slant Flat","[11] Ace Slot Rt Near Y Inline 3 HalfSlide SlantFlat Read","SlantFlat"),
  mkOff("O38","Drive","[12] Wing Rt Far Y Inline 3 HalfSlide Drive Check","Drive"),
  mkOff("O39","Spacing","[11] Bunch Lt Near Y Slot 3 Scat Spacing Pivot","Spacing"),
  mkOff("O40","PostCross","[11] Solo Rt Far Y Lt 3 PlayAction PostCross","PostCross"),
];

export const DEF_CORE40: PlayCall[] = [
  mkDef("D1","Nickel Cover3 Buzz","Nickel Over Rt Cover3 Buzz","Cover3 Buzz"),
  mkDef("D2","Nickel Cover2","Nickel Under Lt Cover2 Cloud","Cover2"),
  mkDef("D3","Nickel ManFree","Nickel Even Rt ManFree Mug","ManFree"),
  mkDef("D4","Nickel FireZone","Nickel Even Lt FireZone Overload","FireZone"),
  mkDef("D5","Nickel Tampa2","Nickel Over Rt Tampa2 Sink","Tampa2"),
  mkDef("D6","Nickel Quarters","Nickel Mint Rt MatchQuarters Poach","MatchQuarters"),
  mkDef("D7","Nickel Cover6","Nickel LightBox Rt Cover6 LateRotate","Cover6"),
  mkDef("D8","Nickel Quarters Sim","Dime Mint Lt MatchQuarters SimCreeper","SimCreeper"),
  mkDef("D9","Base Cover3","Base Over Rt Cover3","Cover3"),
  mkDef("D10","Base Cover1","Base Okie Rt Cover1 OLBEdge","Cover1"),
  mkDef("D11","Bear Zero","Base DoubleEagle Lt Zero Press","Zero"),
  mkDef("D12","Bear Cover1","Base Bear Rt Cover1 Crash","Cover1"),
  mkDef("D13","LOB Press Cover3","Nickel Under Lt Cover1 Press","Cover1 Press"),
  mkDef("D14","LOB Cover3 SlotBlitz","Nickel Over Rt Cover3 SlotBlitz","SlotBlitz"),
  mkDef("D15","LeBeau ZoneBlitz","Dime Odd Lt ZoneBlitz Exchange","ZoneBlitz"),
  mkDef("D16","FireZone WeakDrop","Nickel Okie Rt FireZone WeakDrop","FireZone"),
  mkDef("D17","Cover2 Funnel","Nickel Wide9 Lt Cover2 Funnel","Cover2 Funnel"),
  mkDef("D18","Quarters Trap","Nickel Mint Rt Quarters Trap","Quarters Trap"),
  // fillers (still deterministic)
  mkDef("D19","Cover3 Cloud","Nickel Over Rt Cover3 Cloud","Cover3"),
  mkDef("D20","Cover2 Sink","Nickel Over Rt Cover2 Sink","Cover2"),
  mkDef("D21","Cover1","Nickel Under Rt Cover1","Cover1"),
  mkDef("D22","Palms","Nickel Even Lt Palms Meg","Palms"),
  mkDef("D23","Creeper","Nickel Mint Rt MatchQuarters Sim Creeper","Creeper"),
  mkDef("D24","AGapBluff","Nickel Over Rt Tampa2 AGapBluff","AGapBluff"),
  mkDef("D25","ILBCross","Nickel Okie Rt Cover3 ILBCross","ILBCross"),
  mkDef("D26","SamBlitz","Nickel Over Rt Cover3 SamBlitz","SamBlitz"),
  mkDef("D27","MikePlug","Base Over Lt Cover3 MikePlug","MikePlug"),
  mkDef("D28","Hot2","Nickel Odd Rt FireZone Hot2 Replace","Hot2"),
  mkDef("D29","LateRotate","Nickel LightBox Rt Cover6 LateRotate","LateRotate"),
  mkDef("D30","Buzz","Nickel Over Rt Cover3 Buzz","Buzz"),
  mkDef("D31","Prevent","Dime Even Rt Cover4 Prevent","Prevent"),
  mkDef("D32","GoalLine","GoalLine Bear Rt Zero Pinch","GoalLine"),
  mkDef("D33","RedZone Bracket","Nickel Over Rt Cover3 Bracket","Bracket"),
  mkDef("D34","3rdDown Sim","Dime Mint Rt MatchQuarters Sim","Sim"),
  mkDef("D35","3rdDown Mug","Nickel Even Rt ManFree Mug","Mug"),
  mkDef("D36","3rdDown Overload","Nickel Even Lt FireZone Overload","Overload"),
  mkDef("D37","Base Cover2","Base Under Rt Cover2","Cover2"),
  mkDef("D38","Base Cover3 Under","Base Under Lt Cover3","Cover3"),
  mkDef("D39","Cover6","Nickel LightBox Rt Cover6","Cover6"),
  mkDef("D40","Quarters","Nickel Mint Rt MatchQuarters","MatchQuarters"),
];
