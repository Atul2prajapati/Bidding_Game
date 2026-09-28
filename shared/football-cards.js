// FIFA-style card data for the Football market: nation, six stats, and the legendary Icons.
// Stats are our own estimates for this game, not official EA / FIFA ratings.
//
// Outfield stats: [pace, shooting, passing, dribbling, defending, physical]
// Goalkeepers:    [diving, handling, kicking, reflexes, speed, positioning]

export const STAT_LABELS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
export const GK_LABELS = ["DIV", "HAN", "KIC", "REF", "SPD", "POS"];

const ENG = "🏴󠁧󠁢󠁥󠁮󠁧󠁿", WAL = "🏴󠁧󠁢󠁷󠁬󠁳󠁿";

// Legends: [name, price, rating, position, nation, stats]. Rarest and most expensive cards in the deck.
export const ICON_ROWS = [
  ["Pelé", 15, 97, "FWD", "🇧🇷", [95, 96, 93, 96, 60, 76]],
  ["Maradona", 15, 97, "MID", "🇦🇷", [92, 93, 92, 97, 40, 76]],
  ["Ronaldo Nazário", 14, 96, "FWD", "🇧🇷", [96, 95, 81, 95, 45, 80]],
  ["Zidane", 14, 96, "MID", "🇫🇷", [82, 88, 94, 96, 70, 84]],
  ["Cruyff", 13, 95, "FWD", "🇳🇱", [92, 90, 90, 95, 45, 70]],
  ["Ronaldinho", 13, 94, "FWD", "🇧🇷", [90, 88, 91, 97, 40, 76]],
  ["Puskás", 12, 94, "FWD", "🇭🇺", [86, 95, 88, 92, 45, 74]],
  ["Beckenbauer", 12, 94, "DEF", "🇩🇪", [80, 74, 88, 86, 93, 82]],
  ["Maldini", 12, 94, "DEF", "🇮🇹", [85, 56, 78, 80, 95, 85]],
  ["Eusébio", 12, 93, "FWD", "🇵🇹", [93, 94, 80, 90, 40, 80]],
  ["Henry", 12, 93, "FWD", "🇫🇷", [94, 92, 84, 91, 42, 80]],
  ["Yashin", 11, 93, "GK", "🇷🇺", [92, 90, 78, 94, 60, 92]],
  ["Iniesta", 11, 92, "MID", "🇪🇸", [80, 78, 92, 94, 62, 66]],
  ["Xavi", 11, 92, "MID", "🇪🇸", [72, 78, 95, 90, 66, 68]],
  ["Rivaldo", 11, 92, "FWD", "🇧🇷", [84, 92, 88, 91, 45, 78]],
  ["Buffon", 11, 92, "GK", "🇮🇹", [90, 88, 76, 92, 55, 93]],
  ["Kaká", 11, 91, "MID", "🇧🇷", [90, 88, 87, 90, 48, 76]],
  ["Pirlo", 10, 91, "MID", "🇮🇹", [64, 80, 95, 86, 68, 64]],
  ["Figo", 10, 91, "FWD", "🇵🇹", [86, 85, 90, 90, 48, 76]],
  ["Totti", 10, 90, "FWD", "🇮🇹", [78, 90, 90, 88, 45, 80]],
  ["Bergkamp", 10, 90, "FWD", "🇳🇱", [76, 90, 88, 92, 40, 74]],
  ["Gerrard", 10, 90, "MID", ENG, [78, 89, 90, 85, 78, 85]],
  ["Vieira", 10, 90, "MID", "🇫🇷", [78, 72, 84, 84, 88, 90]],
  ["Roberto Carlos", 10, 90, "DEF", "🇧🇷", [93, 82, 84, 84, 85, 84]],
  ["Cafu", 10, 90, "DEF", "🇧🇷", [90, 68, 82, 84, 86, 84]],
  ["Nesta", 10, 90, "DEF", "🇮🇹", [78, 48, 70, 74, 93, 86]],
  ["Casillas", 10, 90, "GK", "🇪🇸", [89, 84, 70, 92, 62, 86]],
  ["Drogba", 10, 89, "FWD", "🇨🇮", [84, 90, 74, 82, 45, 92]],
  ["Beckham", 10, 89, "MID", ENG, [74, 84, 95, 82, 64, 76]]
];

// Current players: nation + stats.
export const CURRENT = {
  "Messi": ["🇦🇷", [85, 90, 91, 94, 34, 65]], "Ronaldo": ["🇵🇹", [80, 90, 76, 82, 34, 76]], "Mbappé": ["🇫🇷", [97, 90, 80, 92, 36, 78]],
  "Haaland": ["🇳🇴", [89, 93, 66, 80, 45, 88]], "Neymar": ["🇧🇷", [86, 83, 85, 91, 37, 61]], "Vinícius Jr": ["🇧🇷", [95, 84, 81, 91, 29, 69]],
  "Yamal": ["🇪🇸", [88, 79, 84, 90, 30, 58]], "Kane": [ENG, [69, 93, 84, 83, 49, 82]], "Salah": ["🇪🇬", [89, 87, 81, 88, 45, 75]],
  "Bale": [WAL, [85, 84, 81, 83, 50, 75]], "Benzema": ["🇫🇷", [76, 88, 83, 86, 39, 78]], "Lewandowski": ["🇵🇱", [75, 91, 79, 84, 44, 82]],
  "Saka": [ENG, [85, 82, 83, 87, 58, 68]], "Suárez": ["🇺🇾", [70, 86, 80, 82, 48, 78]], "Griezmann": ["🇫🇷", [79, 85, 86, 87, 55, 70]],
  "Son": ["🇰🇷", [87, 86, 80, 84, 42, 69]], "Rashford": [ENG, [88, 80, 74, 82, 40, 74]], "Grealish": [ENG, [77, 76, 82, 87, 46, 67]],
  "Núñez": ["🇺🇾", [89, 80, 68, 77, 43, 82]], "Richarlison": ["🇧🇷", [83, 79, 70, 79, 45, 79]],
  "Bellingham": [ENG, [80, 85, 84, 88, 78, 83]], "Rodri": ["🇪🇸", [62, 80, 86, 84, 86, 85]], "De Bruyne": ["🇧🇪", [70, 88, 94, 86, 65, 74]],
  "Modrić": ["🇭🇷", [72, 76, 89, 88, 72, 66]], "Musiala": ["🇩🇪", [83, 80, 82, 91, 60, 62]], "Pedri": ["🇪🇸", [76, 72, 86, 89, 68, 66]],
  "Kimmich": ["🇩🇪", [68, 74, 88, 82, 81, 76]], "Rice": [ENG, [72, 72, 82, 80, 85, 84]], "De Jong": ["🇳🇱", [80, 70, 86, 87, 78, 78]],
  "Bruno F.": ["🇵🇹", [72, 86, 89, 83, 68, 76]], "Casemiro": ["🇧🇷", [58, 72, 76, 72, 85, 85]], "Mount": [ENG, [76, 78, 82, 82, 58, 68]],
  "Henderson": [ENG, [60, 72, 82, 74, 74, 77]], "Phillips": [ENG, [66, 64, 76, 74, 78, 78]],
  "Van Dijk": ["🇳🇱", [78, 60, 72, 72, 90, 86]], "Rúben Dias": ["🇵🇹", [64, 39, 66, 68, 89, 86]], "Saliba": ["🇫🇷", [83, 40, 68, 72, 87, 82]],
  "Hakimi": ["🇲🇦", [91, 74, 80, 82, 77, 78]], "Rüdiger": ["🇩🇪", [80, 55, 70, 68, 86, 86]], "Theo": ["🇫🇷", [93, 72, 76, 82, 76, 82]],
  "Trent": [ENG, [76, 74, 90, 82, 79, 70]], "Marquinhos": ["🇧🇷", [78, 55, 74, 74, 87, 80]], "Walker": [ENG, [91, 60, 72, 76, 80, 82]],
  "Ramos": ["🇪🇸", [72, 70, 76, 74, 85, 82]], "Maguire": [ENG, [52, 58, 68, 64, 80, 84]], "Trippier": [ENG, [70, 70, 84, 76, 78, 74]],
  "Ben White": [ENG, [80, 55, 74, 76, 80, 76]], "Chilwell": [ENG, [80, 62, 76, 77, 76, 72]],
  "Alisson": ["🇧🇷", [86, 85, 85, 89, 56, 90]], "Courtois": ["🇧🇪", [85, 89, 76, 90, 46, 88]], "Donnarumma": ["🇮🇹", [89, 82, 78, 90, 52, 84]],
  "Ter Stegen": ["🇩🇪", [86, 85, 88, 89, 50, 86]], "Ederson": ["🇧🇷", [85, 82, 93, 86, 63, 85]], "Raya": ["🇪🇸", [82, 80, 88, 84, 55, 82]],
  "Pickford": [ENG, [80, 78, 86, 83, 52, 80]], "Ramsdale": [ENG, [78, 76, 84, 81, 55, 78]]
};

/** Add nation (e), stats (s) and the icon flag to every football card. */
export function decorate(items) {
  const icons = new Map(ICON_ROWS.map(r => [r[0], r]));
  for (const it of items) {
    const ic = icons.get(it.n);
    if (ic) { it.icon = true; it.e = ic[4]; it.s = ic[5]; }
    else if (CURRENT[it.n]) { it.e = CURRENT[it.n][0]; it.s = CURRENT[it.n][1]; }
  }
  return items;
}

/** Card tier shown on the FIFA-style card. */
export const tierOf = it => (it.icon ? "icon" : it.r >= 84 ? "gold" : it.r >= 79 ? "silver" : "bronze");
