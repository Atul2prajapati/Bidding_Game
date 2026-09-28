// FIFA-style card data for the Cricket market: nation, six stats, and legendary Icons.
// Stats are our own estimates for this game, not official ratings.
//
// Stats: [batting, bowling, fielding, power (strike hitting), technique, temperament]
// Keepers show "KPR" (keeping) in the fielding slot.

export const STAT_LABELS = ["BAT", "BWL", "FLD", "PWR", "TEC", "TMP"];
export const WK_LABELS = ["BAT", "BWL", "KPR", "PWR", "TEC", "TMP"];

const ENG = "🏴󠁧󠁢󠁥󠁮󠁧󠁿", IND = "🇮🇳", AUS = "🇦🇺", PAK = "🇵🇰", SA = "🇿🇦", NZ = "🇳🇿", SL = "🇱🇰", WI = "WI";

// Legends: [name, price, rating, role, nation, stats]
export const ICON_ROWS = [
  ["Sachin Tendulkar", 15, 97, "BAT", IND, [99, 50, 86, 84, 99, 95]],
  ["Don Bradman", 15, 99, "BAT", AUS, [99, 20, 84, 80, 99, 99]],
  ["Brian Lara", 14, 96, "BAT", WI, [97, 20, 84, 90, 95, 92]],
  ["Viv Richards", 14, 96, "BAT", WI, [96, 40, 88, 97, 90, 97]],
  ["Jacques Kallis", 14, 96, "AR", SA, [94, 90, 90, 82, 95, 94]],
  ["Garfield Sobers", 14, 96, "AR", WI, [95, 92, 92, 86, 94, 94]],
  ["Shane Warne", 14, 96, "BOWL", AUS, [45, 99, 82, 50, 98, 96]],
  ["AB de Villiers", 13, 95, "BAT", SA, [95, 20, 95, 98, 92, 90]],
  ["Muttiah Muralitharan", 13, 95, "BOWL", SL, [25, 99, 80, 30, 97, 94]],
  ["Glenn McGrath", 13, 95, "BOWL", AUS, [20, 98, 82, 20, 99, 95]],
  ["Wasim Akram", 13, 95, "BOWL", PAK, [55, 98, 84, 70, 96, 95]],
  ["Ricky Ponting", 13, 94, "BAT", AUS, [95, 30, 92, 90, 92, 93]],
  ["Imran Khan", 13, 94, "AR", PAK, [86, 94, 84, 84, 86, 98]],
  ["Rahul Dravid", 12, 93, "BAT", IND, [93, 15, 88, 60, 98, 95]],
  ["Kumar Sangakkara", 12, 93, "WK", SL, [94, 10, 90, 80, 95, 92]],
  ["Adam Gilchrist", 12, 93, "WK", AUS, [92, 10, 92, 97, 84, 90]],
  ["Dale Steyn", 12, 93, "BOWL", SA, [35, 96, 84, 45, 93, 93]],
  ["Kapil Dev", 12, 92, "AR", IND, [84, 92, 88, 90, 80, 94]],
  ["Richard Hadlee", 11, 92, "AR", NZ, [70, 97, 84, 70, 94, 95]],
  ["Ian Botham", 11, 91, "AR", ENG, [86, 90, 88, 92, 80, 94]],
  ["Anil Kumble", 11, 91, "BOWL", IND, [35, 94, 80, 30, 94, 95]],
  ["Waqar Younis", 11, 91, "BOWL", PAK, [30, 95, 80, 40, 90, 90]],
  ["Chris Gayle", 11, 91, "BAT", WI, [91, 50, 78, 99, 80, 88]],
  ["Virender Sehwag", 10, 90, "BAT", IND, [91, 40, 82, 96, 80, 86]],
  ["Sourav Ganguly", 10, 89, "BAT", IND, [90, 55, 82, 86, 88, 94]],
  ["Yuvraj Singh", 10, 89, "AR", IND, [88, 72, 90, 95, 80, 92]],
  ["Sanath Jayasuriya", 10, 89, "AR", SL, [88, 80, 86, 94, 80, 88]],
  ["Shoaib Akhtar", 10, 89, "BOWL", PAK, [30, 93, 78, 50, 82, 88]],
  ["Lasith Malinga", 10, 89, "BOWL", SL, [25, 93, 80, 40, 86, 90]]
];

// Current players: nation + stats.
export const CURRENT = {
  "Virat Kohli": [IND, [94, 20, 86, 82, 93, 95]], "Joe Root": [ENG, [92, 48, 84, 72, 94, 90]], "Rohit Sharma": [IND, [90, 20, 78, 93, 86, 88]],
  "Steve Smith": [AUS, [92, 40, 86, 70, 90, 90]], "Kane Williamson": [NZ, [91, 38, 84, 68, 93, 92]], "Babar Azam": [PAK, [90, 18, 80, 74, 92, 84]],
  "Travis Head": [AUS, [88, 40, 80, 92, 82, 86]], "Shubman Gill": [IND, [88, 15, 82, 82, 88, 84]], "Suryakumar Yadav": [IND, [88, 15, 84, 94, 84, 86]],
  "Yashasvi Jaiswal": [IND, [87, 30, 80, 88, 84, 84]], "Harry Brook": [ENG, [87, 25, 82, 88, 84, 84]], "David Warner": [AUS, [86, 20, 84, 88, 80, 84]],
  "Faf du Plessis": [SA, [84, 15, 88, 84, 82, 86]], "Devon Conway": [NZ, [84, 10, 78, 74, 86, 82]], "Shreyas Iyer": [IND, [83, 20, 80, 82, 80, 80]],
  "Tilak Varma": [IND, [80, 40, 80, 82, 78, 80]], "Rinku Singh": [IND, [80, 10, 84, 88, 74, 90]], "Abhishek Sharma": [IND, [79, 55, 78, 90, 72, 76]],
  "Ajinkya Rahane": [IND, [80, 10, 86, 68, 84, 82]], "Riyan Parag": [IND, [77, 55, 82, 80, 72, 76]], "Prithvi Shaw": [IND, [75, 10, 70, 82, 70, 68]],
  "Mayank Agarwal": [IND, [76, 10, 74, 76, 76, 74]],
  "MS Dhoni": [IND, [86, 10, 92, 90, 82, 99]], "Jos Buttler": [ENG, [88, 10, 88, 93, 82, 88]], "Rishabh Pant": [IND, [87, 10, 86, 92, 78, 88]],
  "Heinrich Klaasen": [SA, [87, 10, 84, 95, 80, 86]], "KL Rahul": [IND, [87, 10, 84, 80, 88, 82]], "Quinton de Kock": [SA, [86, 10, 86, 88, 82, 82]],
  "Mohammad Rizwan": [PAK, [85, 10, 86, 74, 84, 88]], "Sanju Samson": [IND, [84, 10, 84, 90, 80, 78]], "Ishan Kishan": [IND, [80, 10, 80, 86, 74, 76]],
  "Dinesh Karthik": [IND, [78, 10, 84, 84, 76, 86]],
  "Ben Stokes": [ENG, [86, 84, 88, 90, 82, 98]], "Ravindra Jadeja": [IND, [82, 88, 96, 82, 80, 90]], "Hardik Pandya": [IND, [82, 82, 86, 92, 76, 88]],
  "Sunil Narine": [WI, [74, 90, 80, 90, 66, 84]], "Glenn Maxwell": [AUS, [82, 76, 90, 94, 74, 82]], "Andre Russell": [WI, [78, 78, 82, 98, 64, 84]],
  "Shakib Al Hasan": ["🇧🇩", [84, 86, 82, 78, 82, 84]], "Axar Patel": [IND, [76, 86, 84, 80, 74, 84]], "Mitchell Marsh": [AUS, [82, 78, 80, 90, 76, 82]],
  "Cameron Green": [AUS, [82, 80, 82, 86, 78, 80]], "Marcus Stoinis": [AUS, [78, 76, 80, 90, 72, 80]], "Washington Sundar": [IND, [74, 82, 80, 74, 74, 80]],
  "Shivam Dube": [IND, [76, 62, 74, 92, 68, 78]],
  "Jasprit Bumrah": [IND, [30, 97, 80, 40, 94, 96]], "Rashid Khan": ["🇦🇫", [60, 93, 86, 80, 90, 90]], "Pat Cummins": [AUS, [55, 92, 84, 68, 90, 94]],
  "Mitchell Starc": [AUS, [50, 91, 80, 62, 86, 90]], "Kagiso Rabada": [SA, [40, 91, 82, 50, 88, 88]], "Trent Boult": [NZ, [30, 89, 84, 40, 88, 86]],
  "Shaheen Afridi": [PAK, [40, 89, 80, 60, 84, 86]], "Mohammed Shami": [IND, [30, 90, 78, 40, 90, 86]], "Josh Hazlewood": [AUS, [30, 89, 80, 35, 92, 86]],
  "Kuldeep Yadav": [IND, [30, 88, 78, 30, 86, 84]], "Ravichandran Ashwin": [IND, [70, 89, 76, 50, 92, 88]], "Nathan Lyon": [AUS, [40, 88, 78, 40, 90, 86]],
  "Yuzvendra Chahal": [IND, [20, 87, 76, 20, 84, 82]], "Mohammed Siraj": [IND, [25, 87, 80, 30, 84, 86]], "Arshdeep Singh": [IND, [20, 85, 80, 30, 82, 84]],
  "Mark Wood": [ENG, [35, 87, 78, 50, 80, 82]], "Bhuvneshwar Kumar": [IND, [45, 84, 78, 50, 86, 82]], "Adam Zampa": [AUS, [20, 84, 78, 30, 82, 82]],
  "Deepak Chahar": [IND, [50, 80, 78, 60, 78, 76]], "Harshal Patel": [IND, [40, 80, 78, 55, 76, 78]], "Umran Malik": [IND, [15, 78, 72, 20, 68, 70]],
  "Ruturaj Gaikwad": [IND, [81, 10, 80, 80, 82, 80]], "Venkatesh Iyer": [IND, [77, 50, 78, 84, 72, 76]], "Nitish Rana": [IND, [75, 45, 78, 80, 72, 74]],
  "Dhruv Jurel": [IND, [77, 10, 82, 78, 76, 82]], "Jitesh Sharma": [IND, [73, 10, 80, 84, 68, 74]],
  "Tim David": [AUS, [76, 40, 80, 95, 66, 80]], "Shardul Thakur": [IND, [66, 78, 78, 78, 68, 84]], "Rahul Tewatia": [IND, [72, 70, 78, 86, 66, 86]],
  "Ravi Bishnoi": [IND, [25, 80, 84, 25, 78, 80]], "Prasidh Krishna": [IND, [20, 78, 76, 25, 74, 76]], "Avesh Khan": [IND, [20, 76, 76, 25, 72, 74]],
  "Mukesh Kumar": [IND, [20, 75, 74, 20, 74, 76]]
};

/** Add nation (e), stats (s) and the icon flag to every cricket card. */
export function decorate(items) {
  const icons = new Map(ICON_ROWS.map(r => [r[0], r]));
  for (const it of items) {
    const ic = icons.get(it.n);
    if (ic) { it.icon = true; it.e = ic[4]; it.s = ic[5]; }
    else if (CURRENT[it.n]) { it.e = CURRENT[it.n][0]; it.s = CURRENT[it.n][1]; }
  }
  return items;
}

export const tierOf = it => (it.icon ? "icon" : it.r >= 86 ? "gold" : it.r >= 80 ? "silver" : "bronze");
