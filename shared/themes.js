// Markets: every card, its price, rating and category, plus the scoring rules.
// Shared by the browser (solo games) and the Node server (multiplayer games).

import * as FUT from "./football-cards.js";
import * as CRK from "./cricket-cards.js";

export const BUDGET = 100;

// Row: [name, price, rating, category, extra (series / publisher / emoji), source id for photos]
const mk=rows=>rows.map(([n,p,r,t,e,x])=>({n,p,r,t,e:e||"",x}));

function foodRules(cfg){
  return its=>{
    const c={}; its.forEach(x=>c[x.t]=(c[x.t]||0)+1); const out=[];
    cfg.must.forEach(([k,l,v])=>{ if(!c[k]) out.push([l,v]); });
    cfg.nice.forEach(([k,l,v])=>{ if(c[k]) out.push([l,v]); });
    cfg.one.forEach(([k,l,v])=>{ if(c[k]>1) out.push([l,v*(c[k]-1)]); });
    return out;
  };
}

export const THEMES={
  anime:{
    label:"Anime", blurb:"Assemble a squad of six. Gojo and Goku cost $30, Yamcha costs $2.", slots:6, kind:"anime", base:80, pw:.8, rate:"Power",
    bots:["Senpai","Sensei","Otaku-kun","Chibi","Waifu Lord"],
    cats:{FTR:["Fighter","#ff7a8f"],BRN:["Brains","#3ec7ff"],SUP:["Support","#19c37d"],VIL:["Villain","#b388ff"]},
    series:{dbz:["Dragon Ball","#ff9f1c","#e63946"],nar:["Naruto","#f77f00","#1d3557"],op:["One Piece","#e63946","#ffb703"],
      jjk:["Jujutsu Kaisen","#7b2cbf","#3a86ff"],aot:["Attack on Titan","#7f8c5a","#283618"],ds:["Demon Slayer","#2a9d8f","#e76f51"],
      mha:["My Hero Academia","#06d6a0","#118ab2"],opm:["One Punch Man","#ffd60a","#ef476f"],csm:["Chainsaw Man","#ff4d6d","#590d22"],
      dn:["Death Note","#495057","#111418"],hxh:["Hunter x Hunter","#80b918","#1b6b3a"],bl:["Bleach","#ff7b00","#1a1a1a"],
      fma:["Fullmetal Alchemist","#c1121f","#f4a261"],sxf:["Spy x Family","#ff8fab","#1b4332"],kono:["KonoSuba","#4cc9f0","#f72585"],
      bc:["Black Clover","#52796f","#1b1b1b"]},
    items:mk([
      ["Goku",30,98,"FTR","dbz"],["Vegeta",24,95,"FTR","dbz"],["Frieza",20,94,"VIL","dbz"],["Krillin",5,70,"FTR","dbz"],["Mr. Satan",2,40,"SUP","dbz"],
      ["Naruto",26,95,"FTR","nar"],["Sasuke",24,94,"FTR","nar"],["Madara",26,96,"VIL","nar"],["Itachi",22,93,"VIL","nar"],["Kakashi",16,88,"BRN","nar"],
      ["Rock Lee",8,78,"FTR","nar"],["Sakura",6,72,"SUP","nar"],
      ["Luffy",28,96,"FTR","op"],["Zoro",20,92,"FTR","op"],["Sanji",16,88,"FTR","op"],["Nami",6,65,"BRN","op"],["Usopp",4,58,"SUP","op"],
      ["Gojo",30,98,"FTR","jjk"],["Sukuna",30,99,"VIL","jjk"],["Yuji",14,85,"FTR","jjk"],["Megumi",10,80,"BRN","jjk"],
      ["Levi",18,90,"FTR","aot"],["Eren",16,88,"VIL","aot"],["Mikasa",14,87,"FTR","aot"],["Armin",6,70,"BRN","aot"],
      ["Rengoku",18,90,"FTR","ds"],["Muzan",20,92,"VIL","ds"],["Tanjiro",14,85,"FTR","ds"],["Nezuko",10,80,"SUP","ds"],["Zenitsu",8,78,"FTR","ds"],["Inosuke",8,77,"FTR","ds"],
      ["All Might",22,94,"FTR","mha"],["Deku",16,88,"FTR","mha"],["Bakugo",14,86,"FTR","mha"],["Todoroki",14,86,"FTR","mha"],
      ["Saitama",30,100,"FTR","opm"],["Genos",10,80,"FTR","opm"],
      ["Makima",22,93,"VIL","csm"],["Denji",12,82,"FTR","csm"],["Power",8,76,"FTR","csm"],
      ["L",14,88,"BRN","dn"],["Light Yagami",14,85,"VIL","dn"],
      ["Killua",14,86,"FTR","hxh"],["Gon",12,84,"FTR","hxh"],
      ["Aizen",24,95,"VIL","bl"],["Ichigo",20,92,"FTR","bl"],
      ["Edward Elric",12,84,"BRN","fma"],
      ["Yor",14,86,"FTR","sxf"],["Loid",12,82,"BRN","sxf"],["Anya",6,68,"SUP","sxf"],
      ["Megumin",5,72,"FTR","kono"],["Kazuma",4,55,"BRN","kono"],["Aqua",3,50,"SUP","kono"],
      ["Asta",10,82,"FTR","bc"],
      ["Shikamaru",8,80,"BRN","nar"],["Hinata",6,72,"SUP","nar"],["Choji",4,62,"FTR","nar"],
      ["Chopper",5,66,"SUP","op"],["Brook",5,68,"FTR","op"],
      ["Uraraka",6,72,"SUP","mha"],["Kaminari",4,62,"FTR","mha"],["Mineta",2,38,"SUP","mha"],
      ["Yamcha",2,45,"FTR","dbz"],["Chiaotzu",2,42,"SUP","dbz"],
      ["Kobeni",3,50,"SUP","csm"],["Mumen Rider",2,45,"SUP","opm"]
    ]),
    combos:[
      ["Team 7",["Naruto","Sasuke","Sakura","Kakashi"],15],
      ["Team 10 duo",["Shikamaru","Choji"],5],
      ["Monster Trio",["Luffy","Zoro","Sanji"],12],
      ["Kamaboko squad",["Tanjiro","Nezuko","Zenitsu","Inosuke"],12],
      ["Forger family",["Loid","Yor","Anya"],12],
      ["KonoSuba party",["Kazuma","Aqua","Megumin"],12],
      ["Uchiha clan",["Itachi","Sasuke","Madara"],10],
      ["Saiyan pride",["Goku","Vegeta"],8],
      ["Hunter duo",["Gon","Killua"],7],
      ["Strongest vs King of Curses",["Gojo","Sukuna"],6],
      ["Rivals",["Deku","Bakugo"],6]
    ],
    rules:its=>{
      const c={FTR:0,BRN:0,SUP:0,VIL:0}; its.forEach(x=>c[x.t]++); const out=[];
      if(!c.FTR) out.push(["No fighters",-20]);
      if(c.BRN) out.push(["Has a strategist",6]);
      if(c.SUP) out.push(["Has support",6]);
      if(c.VIL>=2) out.push(["Villain arc",8]);
      if(c.FTR>=5) out.push(["All muscle, no plan",-8]);
      return out;
    }
  },
  pokemon:{
    label:"Pokémon", blurb:"Build a team of six. Arceus costs $30, Magikarp costs $2.", slots:6, kind:"pokemon", base:70, pw:.8, rate:"Power",
    bots:["Ash","Misty","Brock","Team Rocket","Professor Oak"],
    cats:{psychic:["Psychic","#fa7179"],dragon:["Dragon","#7f5cf5"],normal:["Normal","#c6c6a7"],fire:["Fire","#ff9c54"],ground:["Ground","#e2bf65"],water:["Water","#6390f0"],steel:["Steel","#b7b7ce"],ghost:["Ghost","#8a78c0"],ice:["Ice","#96d9d6"],electric:["Electric","#f7d02c"],grass:["Grass","#7ac74c"],rock:["Rock","#c9b66b"],fighting:["Fighting","#e05a4f"],bug:["Bug","#a6b91a"],dark:["Dark","#8d7a6a"],fairy:["Fairy","#f4a3c9"],poison:["Poison","#b56cd6"]},
    // Price and power come from each Pokémon's real base stat total (PokeAPI). Last field is the Pokédex number.
    items:mk([
      ["Mewtwo",27,94,"psychic","",150],["Mew",20,83,"psychic","",151],["Rayquaza",27,94,"dragon","",384],["Arceus",30,100,"normal","",493],["Lugia",27,94,"psychic","",249],
      ["Ho-Oh",27,94,"fire","",250],["Groudon",26,93,"ground","",383],["Kyogre",26,93,"water","",382],["Dialga",27,94,"steel","",483],["Palkia",27,94,"water","",484],
      ["Giratina",27,94,"ghost","",487],["Zekrom",27,94,"dragon","",644],["Reshiram",27,94,"dragon","",643],["Articuno",19,81,"ice","",144],["Zapdos",19,81,"electric","",145],
      ["Moltres",19,81,"fire","",146],["Charizard",22,74,"fire","",6],["Blastoise",16,74,"water","",9],["Venusaur",15,73,"grass","",3],["Dragonite",20,83,"dragon","",149],
      ["Tyranitar",20,83,"rock","",248],["Garchomp",20,83,"dragon","",445],["Metagross",20,83,"steel","",376],["Salamence",20,83,"dragon","",373],["Lucario",18,73,"fighting","",448],
      ["Greninja",18,74,"water","",658],["Blaziken",16,74,"fire","",257],["Gengar",16,69,"ghost","",94],["Gyarados",16,75,"water","",130],["Snorlax",16,75,"normal","",143],
      ["Alakazam",14,69,"psychic","",65],["Machamp",14,70,"fighting","",68],["Arcanine",17,77,"fire","",59],["Lapras",16,74,"water","",131],["Scizor",14,69,"bug","",212],
      ["Gardevoir",15,72,"psychic","",282],["Infernape",16,74,"fire","",392],["Swampert",16,74,"water","",260],["Sceptile",16,74,"grass","",254],["Mimikyu",14,66,"ghost","",778],
      ["Umbreon",15,73,"dark","",197],["Espeon",15,73,"psychic","",196],["Sylveon",15,73,"fairy","",700],["Vaporeon",15,73,"water","",134],["Jolteon",15,73,"electric","",135],
      ["Flareon",15,73,"fire","",136],["Pikachu",10,44,"electric","",25],["Raichu",13,67,"electric","",26],["Eevee",8,45,"normal","",133],["Bulbasaur",5,44,"grass","",1],
      ["Charmander",4,43,"fire","",4],["Squirtle",5,44,"water","",7],["Jigglypuff",3,38,"normal","",39],["Psyduck",5,44,"water","",54],["Meowth",4,40,"normal","",52],
      ["Slowpoke",5,44,"water","",79],["Geodude",4,42,"rock","",74],["Onix",8,53,"rock","",95],["Togepi",3,34,"fairy","",175],["Wobbuffet",8,56,"psychic","",202],
      ["Sudowoodo",9,57,"rock","",185],["Chansey",11,63,"normal","",113],["Porygon",8,55,"normal","",137],["Cubone",5,44,"ground","",104],["Ditto",4,40,"normal","",132],
      ["Magikarp",2,28,"water","",129],["Bidoof",3,35,"normal","",399],["Pidgey",3,35,"normal","",16],["Rattata",3,35,"normal","",19],["Zubat",3,34,"poison","",41],
      ["Caterpie",2,27,"bug","",10],["Weedle",2,27,"bug","",13],["Ekans",4,40,"poison","",23],["Koffing",6,47,"poison","",109],["Diglett",3,37,"ground","",50],
      ["Abra",4,43,"psychic","",63],["Oddish",5,44,"grass","",43],["Sunkern",2,25,"grass","",191]    ]),
    combos:[
      ["Legendary birds",["Articuno","Zapdos","Moltres"],15],
      ["Weather trio",["Groudon","Kyogre","Rayquaza"],12],
      ["Creation trio",["Dialga","Palkia","Giratina"],12],
      ["Kanto starters",["Bulbasaur","Charmander","Squirtle"],12],
      ["Fully evolved starters",["Venusaur","Charizard","Blastoise"],10],
      ["Eeveelutions",["Vaporeon","Jolteon","Flareon"],10],
      ["Ash's best",["Pikachu","Charizard","Greninja"],10],
      ["Team Rocket",["Meowth","Ekans","Koffing"],10],
      ["Tao duo",["Reshiram","Zekrom"],8],
      ["Gotta evolve",["Magikarp","Gyarados"],6],
      ["Moon and sun",["Umbreon","Espeon"],6]
    ],
    rules:its=>{
      const LEG=new Set(["Mewtwo","Mew","Rayquaza","Arceus","Lugia","Ho-Oh","Groudon","Kyogre","Dialga","Palkia","Giratina","Zekrom","Reshiram","Articuno","Zapdos","Moltres"]);
      const out=[], types=new Set(its.map(x=>x.t)), leg=its.filter(x=>LEG.has(x.n)).length;
      if(types.size>=6) out.push(["Full type coverage",12]); else if(types.size>=4) out.push(["Good type coverage",6]);
      if(its.length>=3&&types.size===1) out.push(["One-type team",-10]);
      if(leg>2) out.push(["Legendary overload",-12*(leg-2)]);
      return out;
    }
  },
  heroes:{
    label:"Superheroes", blurb:"Assemble a squad of six from Marvel and DC. Superman and Thanos cost $30.", slots:6, kind:"heroes", base:78, pw:.8, rate:"Power",
    bots:["Nick Fury","Oracle","Alfred","Wong","Maria Hill"],
    cats:{PWR:["Powerhouse","#ff7a8f"],TEC:["Genius","#3ec7ff"],MYS:["Magic & cosmic","#b388ff"],STR:["Street-level","#19c37d"],VIL:["Villain","#ffb020"]},
    series:{marvel:["Marvel","#e62429","#7a0a0e"],dc:["DC","#0476f2","#0b2a5b"]},
    // Last field is the Superhero API id (akabab.github.io/superhero-api), used for photos.
    items:mk([
      ["Thor",26,94,"PWR","marvel",659],["Hulk",24,92,"PWR","marvel",332],["Iron Man",26,90,"TEC","marvel",346],["Captain America",20,86,"STR","marvel",149],
      ["Spider-Man",22,88,"STR","marvel",620],["Captain Marvel",22,91,"PWR","marvel",157],["Doctor Strange",22,91,"MYS","marvel",226],["Scarlet Witch",24,93,"MYS","marvel",579],
      ["Black Panther",16,85,"STR","marvel",106],["Wolverine",18,87,"STR","marvel",717],["Deadpool",14,84,"STR","marvel",213],["Vision",16,86,"PWR","marvel",697],
      ["Silver Surfer",20,90,"MYS","marvel",598],["Jean Grey",18,89,"MYS","marvel",356],["Black Widow",10,76,"STR","marvel",107],["She-Hulk",12,84,"PWR","marvel",589],
      ["Ghost Rider",12,84,"MYS","marvel",280],["Storm",12,82,"MYS","marvel",638],["Professor X",14,84,"TEC","marvel",527],["Daredevil",10,80,"STR","marvel",201],
      ["War Machine",10,80,"TEC","marvel",703],["Gamora",10,78,"STR","marvel",275],["Winter Soldier",7,76,"STR","marvel",714],["Moon Knight",7,78,"STR","marvel",470],
      ["Blade",7,78,"STR","marvel",112],["Quicksilver",6,78,"PWR","marvel",536],["Rogue",6,78,"PWR","marvel",567],["Gambit",6,76,"STR","marvel",274],
      ["Punisher",6,76,"STR","marvel",530],["Cyclops",6,76,"STR","marvel",196],["Star-Lord",6,72,"TEC","marvel",630],["Groot",6,76,"PWR","marvel",303],
      ["Drax",5,74,"PWR","marvel",234],["Iceman",5,76,"MYS","marvel",339],["Nightcrawler",5,74,"STR","marvel",490],["Hawkeye",6,70,"STR","marvel",313],
      ["Rocket Raccoon",6,70,"TEC","marvel",566],["Ant-Man",6,70,"TEC","marvel",30],["Nick Fury",6,70,"TEC","marvel",489],["Falcon",5,68,"STR","marvel",251],
      ["Wasp",5,66,"TEC","marvel",708],["Jubilee",3,60,"MYS","marvel",372],
      ["Thanos",30,98,"VIL","marvel",655],["Galactus",30,99,"VIL","marvel",273],["Magneto",20,89,"VIL","marvel",423],["Doctor Doom",20,89,"VIL","marvel",222],
      ["Ultron",18,87,"VIL","marvel",680],["Loki",16,84,"VIL","marvel",414],["Venom",14,83,"VIL","marvel",687],["Green Goblin",10,76,"VIL","marvel",299],
      ["Mystique",6,70,"VIL","marvel",480],["Red Skull",6,68,"VIL","marvel",550],
      ["Superman",30,99,"PWR","dc",644],["Wonder Woman",26,95,"PWR","dc",720],["Batman",24,90,"TEC","dc",69],["Flash",20,88,"PWR","dc",263],
      ["Shazam",20,90,"PWR","dc",156],["Supergirl",20,90,"PWR","dc",643],["Green Lantern",18,88,"MYS","dc",306],["Martian Manhunter",18,90,"MYS","dc",432],
      ["Aquaman",14,82,"PWR","dc",38],["Cyborg",10,78,"TEC","dc",194],["Starfire",10,80,"PWR","dc",632],["Raven",10,82,"MYS","dc",542],
      ["Nightwing",6,74,"STR","dc",491],["Catwoman",5,72,"STR","dc",165],["Robin",5,66,"STR","dc",561],["Beast Boy",5,70,"PWR","dc",76],
      ["Alfred Pennyworth",3,55,"TEC","dc",17],["Aquababy",2,30,"PWR","dc",36],
      ["Darkseid",28,97,"VIL","dc",204],["Black Adam",20,91,"VIL","dc",95],["Joker",16,84,"VIL","dc",370],["Lex Luthor",14,82,"VIL","dc",405],
      ["Bane",10,78,"VIL","dc",60],["Harley Quinn",6,74,"VIL","dc",309],["Two-Face",6,72,"VIL","dc",678],["Riddler",5,70,"VIL","dc",558],
      ["Scarecrow",4,66,"VIL","dc",576],["Penguin",4,64,"VIL","dc",514],
      ["Kid Flash",3,64,"PWR","dc",384],["Black Canary",4,68,"STR","dc",97],["Deadshot",4,66,"VIL","dc",214],["Killer Frost",4,66,"VIL","dc",387],
      ["Captain Cold",2,58,"VIL","dc",152],["Clock King",2,48,"VIL","dc",181],
      ["Black Cat",4,66,"STR","marvel",99],["Kingpin",4,68,"VIL","marvel",391],["Negasonic Teenage Warhead",3,62,"PWR","marvel",488],
      ["Multiple Man",3,60,"STR","marvel",478],["Vulture",3,60,"VIL","marvel",701],["Pyro",2,55,"VIL","marvel",532]
    ]),
    combos:[
      ["Original Avengers",["Iron Man","Captain America","Thor","Hulk","Black Widow","Hawkeye"],25],
      ["Guardians of the Galaxy",["Star-Lord","Gamora","Drax","Groot","Rocket Raccoon"],18],
      ["The Trinity",["Superman","Batman","Wonder Woman"],15],
      ["X-Men",["Professor X","Cyclops","Jean Grey","Storm","Wolverine"],15],
      ["Big Three",["Iron Man","Captain America","Thor"],12],
      ["Bat-family",["Batman","Robin","Nightwing","Alfred Pennyworth"],12],
      ["Justice League speedsters & swimmers",["Flash","Aquaman","Cyborg"],8],
      ["Deadpool & Wolverine",["Deadpool","Wolverine"],10],
      ["Mad love",["Joker","Harley Quinn"],8],
      ["I am Groot",["Groot","Rocket Raccoon"],6],
      ["Suicide Squad",["Harley Quinn","Deadshot","Captain Cold"],8],
      ["Maximum effort",["Deadpool","Negasonic Teenage Warhead"],6],
      ["Snack for Galactus",["Galactus","Aquababy"],-8]
    ],
    rules:its=>{
      const c={PWR:0,TEC:0,MYS:0,STR:0,VIL:0}; its.forEach(x=>c[x.t]++); const out=[], pubs=new Set(its.map(x=>x.e));
      if(c.TEC) out.push(["Has a genius",5]);
      if(c.MYS) out.push(["Has magic or cosmic power",5]);
      if(c.VIL>=2) out.push(["Villain team-up",6]);
      if(c.VIL===its.length&&its.length>=4) out.push(["Legion of Doom",8]);
      if(pubs.size>1) out.push(["Marvel x DC crossover",4]);
      return out;
    }
  },
  football:{
    label:"Football XI", blurb:"Sign a starting eleven. Stars cost $10, legendary Icons up to $15.", slots:11, kind:"football", base:75, pw:1.6, rate:"OVR",
    bots:["Pep","Zizou","Carlo","Xabi","Mikel"],
    cats:{GK:["Keepers","#ffb020"],DEF:["Defenders","#3ec7ff"],MID:["Midfield","#19c37d"],FWD:["Forwards","#ff7a8f"]},
    items:mk([
      ["Messi",10,91,"FWD"],["Ronaldo",10,88,"FWD"],["Mbappé",10,92,"FWD"],["Haaland",10,91,"FWD"],["Neymar",9,87,"FWD"],
      ["Vinícius Jr",9,90,"FWD"],["Yamal",9,89,"FWD"],["Kane",8,89,"FWD"],["Salah",8,89,"FWD"],["Bale",7,84,"FWD"],
      ["Benzema",7,86,"FWD"],["Lewandowski",7,88,"FWD"],["Saka",7,87,"FWD"],["Suárez",6,84,"FWD"],["Griezmann",5,86,"FWD"],
      ["Son",5,86,"FWD"],["Rashford",3,81,"FWD"],["Grealish",3,82,"FWD"],["Núñez",3,80,"FWD"],["Richarlison",2,79,"FWD"],
      ["Bellingham",9,89,"MID"],["Rodri",8,90,"MID"],["De Bruyne",8,88,"MID"],["Modrić",7,86,"MID"],["Musiala",7,87,"MID"],
      ["Pedri",6,86,"MID"],["Kimmich",6,86,"MID"],["Rice",5,86,"MID"],["De Jong",5,85,"MID"],["Bruno F.",5,86,"MID"],
      ["Casemiro",4,83,"MID"],["Mount",2,78,"MID"],["Henderson",2,79,"MID"],["Phillips",2,76,"MID"],
      ["Van Dijk",7,89,"DEF"],["Rúben Dias",6,88,"DEF"],["Saliba",6,87,"DEF"],["Hakimi",6,85,"DEF"],["Rüdiger",5,86,"DEF"],
      ["Theo",5,85,"DEF"],["Trent",5,86,"DEF"],["Marquinhos",4,85,"DEF"],["Walker",4,84,"DEF"],["Ramos",4,84,"DEF"],
      ["Maguire",3,79,"DEF"],["Trippier",3,81,"DEF"],["Ben White",2,80,"DEF"],["Chilwell",2,78,"DEF"],
      ["Alisson",6,89,"GK"],["Courtois",6,89,"GK"],["Donnarumma",5,88,"GK"],["Ter Stegen",5,87,"GK"],["Ederson",4,87,"GK"],
      ["Raya",3,84,"GK"],["Pickford",3,82,"GK"],["Ramsdale",2,80,"GK"],
      // Legendary Icons: the rarest, most expensive cards (see shared/football-cards.js)
      ...FUT.ICON_ROWS.map(([n, p, r, t]) => [n, p, r, t])
    ]),
    combos:[
      ["MSN",["Messi","Suárez","Neymar"],12],
      ["BBC",["Bale","Benzema","Ronaldo"],12],
      ["The GOAT debate",["Messi","Ronaldo"],6],
      ["City machine",["Rodri","De Bruyne","Haaland","Rúben Dias"],10],
      ["Madrid spine",["Courtois","Rüdiger","Bellingham","Vinícius Jr"],8],
      ["Three Lions",["Kane","Saka","Rice","Bellingham"],8],
      ["Arsenal core",["Saka","Rice","Saliba","Raya"],8],
      ["Tiki-taka",["Xavi","Iniesta","Messi"],12],
      ["Galácticos",["Zidane","Figo","Ronaldo Nazário","Beckham"],12],
      ["The three Rs",["Ronaldo Nazário","Ronaldinho","Rivaldo"],12],
      ["The Invincibles",["Henry","Vieira","Bergkamp"],10],
      ["Azzurri 2006",["Buffon","Pirlo","Totti"],10],
      ["Kings of football",["Pelé","Maradona"],8],
      ["Milan wall",["Maldini","Nesta"],6],
      ["Old GOAT meets new",["Pelé","Messi"],5]
    ],
    rules:its=>{
      const c={GK:0,DEF:0,MID:0,FWD:0}; its.forEach(x=>c[x.t]++); const out=[];
      if(!c.GK) out.push(["No goalkeeper",-25]);
      if(c.GK>1) out.push([(c.GK-1)+" spare keeper"+(c.GK>2?"s":""),-15*(c.GK-1)]);
      let q=(c.GK>=1)+(c.DEF>=3)+(c.MID>=3)+(c.FWD>=2);
      if(q) out.push(["Formation "+q+"/4 lines filled",q*5]);
      if(c.FWD>4) out.push(["Too many strikers",-8*(c.FWD-4)]);
      // Card stats: [pace, shooting, passing, dribbling, defending, physical]; keepers use reflexes at index 3.
      const avg=(arr,k)=>arr.length?arr.reduce((s,x)=>s+(x.s?x.s[k]:0),0)/arr.length:0;
      const by=t=>its.filter(x=>x.t===t);
      if(by("FWD").length>=2&&avg(by("FWD"),0)>=88) out.push(["Rapid attack (forwards avg pace 88+)",8]);
      if(by("DEF").length>=3&&avg(by("DEF"),4)>=86) out.push(["Brick wall (defenders avg defending 86+)",8]);
      if(by("MID").length>=2&&avg(by("MID"),2)>=88) out.push(["Midfield maestros (avg passing 88+)",6]);
      if(by("FWD").some(x=>x.s&&x.s[1]>=93)) out.push(["Clinical finisher (shooting 93+)",4]);
      if(by("GK").some(x=>x.s&&x.s[3]>=90)) out.push(["Safe hands (reflexes 90+)",4]);
      const icons=its.filter(x=>x.icon).length;
      if(icons>=3) out.push(["Hall of fame ("+icons+" Icons)",6]);
      return out;
    }
  },
  cricket:{
    label:"Cricket", blurb:"Pick an XI of IPL and international stars. Kohli and Bumrah cost $10, legends up to $15.", slots:11, kind:"cricket", base:78, pw:1.6, rate:"OVR",
    bots:["Thala","Hitman","Captain Cool","Boom Boom","Universe Boss"],
    cats:{BAT:["Batters","#ffb020"],WK:["Keepers","#3ec7ff"],AR:["All-rounders","#19c37d"],BOWL:["Bowlers","#ff7a8f"]},
    items:mk([
      ["Virat Kohli",10,92,"BAT"],["Joe Root",9,90,"BAT"],["Rohit Sharma",9,89,"BAT"],["Steve Smith",8,88,"BAT"],["Kane Williamson",8,88,"BAT"],
      ["Babar Azam",8,87,"BAT"],["Travis Head",8,87,"BAT"],["Shubman Gill",8,86,"BAT"],["Suryakumar Yadav",8,86,"BAT"],["Yashasvi Jaiswal",7,85,"BAT"],
      ["Harry Brook",7,85,"BAT"],["David Warner",6,84,"BAT"],["Faf du Plessis",5,82,"BAT"],["Devon Conway",5,82,"BAT"],["Shreyas Iyer",5,81,"BAT"],
      ["Tilak Varma",4,78,"BAT"],["Rinku Singh",4,79,"BAT"],["Abhishek Sharma",4,78,"BAT"],["Ajinkya Rahane",3,78,"BAT"],["Riyan Parag",3,76,"BAT"],
      ["Prithvi Shaw",2,72,"BAT"],["Mayank Agarwal",2,74,"BAT"],
      ["MS Dhoni",9,88,"WK"],["Jos Buttler",8,87,"WK"],["Rishabh Pant",8,86,"WK"],["Heinrich Klaasen",7,86,"WK"],["KL Rahul",7,85,"WK"],
      ["Quinton de Kock",7,85,"WK"],["Mohammad Rizwan",6,84,"WK"],["Sanju Samson",6,83,"WK"],["Ishan Kishan",4,79,"WK"],["Dinesh Karthik",3,77,"WK"],
      ["Ben Stokes",9,89,"AR"],["Ravindra Jadeja",8,88,"AR"],["Hardik Pandya",8,86,"AR"],["Sunil Narine",7,85,"AR"],["Glenn Maxwell",7,84,"AR"],
      ["Andre Russell",7,84,"AR"],["Shakib Al Hasan",6,84,"AR"],["Axar Patel",6,83,"AR"],["Mitchell Marsh",6,82,"AR"],["Cameron Green",6,82,"AR"],
      ["Marcus Stoinis",5,80,"AR"],["Washington Sundar",4,78,"AR"],["Shivam Dube",4,78,"AR"],
      ["Jasprit Bumrah",10,94,"BOWL"],["Rashid Khan",9,90,"BOWL"],["Pat Cummins",9,90,"BOWL"],["Mitchell Starc",8,88,"BOWL"],["Kagiso Rabada",8,88,"BOWL"],
      ["Trent Boult",7,86,"BOWL"],["Shaheen Afridi",7,86,"BOWL"],["Mohammed Shami",7,86,"BOWL"],["Josh Hazlewood",7,86,"BOWL"],["Kuldeep Yadav",7,85,"BOWL"],
      ["Ravichandran Ashwin",6,85,"BOWL"],["Nathan Lyon",6,84,"BOWL"],["Yuzvendra Chahal",6,83,"BOWL"],["Mohammed Siraj",6,83,"BOWL"],["Arshdeep Singh",5,81,"BOWL"],
      ["Mark Wood",5,82,"BOWL"],["Bhuvneshwar Kumar",4,80,"BOWL"],["Adam Zampa",4,79,"BOWL"],["Deepak Chahar",3,76,"BOWL"],["Harshal Patel",3,76,"BOWL"],
      ["Umran Malik",2,72,"BOWL"],
      ["Ruturaj Gaikwad",4,80,"BAT"],["Venkatesh Iyer",3,76,"BAT"],["Nitish Rana",2,74,"BAT"],
      ["Dhruv Jurel",3,76,"WK"],["Jitesh Sharma",2,73,"WK"],
      ["Tim David",4,78,"AR"],["Shardul Thakur",3,76,"AR"],["Rahul Tewatia",2,73,"AR"],
      ["Ravi Bishnoi",3,78,"BOWL"],["Prasidh Krishna",3,76,"BOWL"],["Avesh Khan",2,74,"BOWL"],["Mukesh Kumar",2,73,"BOWL"],
      // Legendary Icons: the rarest, most expensive cards (see shared/cricket-cards.js)
      ...CRK.ICON_ROWS.map(([n, p, r, t]) => [n, p, r, t])
    ]),
    combos:[
      ["Fab Four",["Virat Kohli","Joe Root","Steve Smith","Kane Williamson"],15],
      ["Aussie pace trio",["Pat Cummins","Mitchell Starc","Josh Hazlewood"],12],
      ["Ro-Ko",["Rohit Sharma","Virat Kohli"],10],
      ["Mumbai Indians core",["Rohit Sharma","Jasprit Bumrah","Hardik Pandya","Suryakumar Yadav"],10],
      ["Thala & Sir Jadeja",["MS Dhoni","Ravindra Jadeja"],8],
      ["KKR mystery & muscle",["Sunil Narine","Andre Russell"],8],
      ["RCB dreamers",["Virat Kohli","Glenn Maxwell","Faf du Plessis"],8],
      ["Kul-Cha",["Kuldeep Yadav","Yuzvendra Chahal"],6],
      ["Aussie dynasty",["Ricky Ponting","Adam Gilchrist","Glenn McGrath","Shane Warne"],15],
      ["The great all-rounders",["Imran Khan","Kapil Dev","Ian Botham","Richard Hadlee"],15],
      ["Spin wizards",["Shane Warne","Muttiah Muralitharan","Anil Kumble"],12],
      ["World Cup 2011",["Sachin Tendulkar","MS Dhoni","Yuvraj Singh","Virender Sehwag"],12],
      ["Indian batting legends",["Sachin Tendulkar","Rahul Dravid","Sourav Ganguly"],12],
      ["The two Ws",["Wasim Akram","Waqar Younis"],10],
      ["Calypso kings",["Viv Richards","Brian Lara","Chris Gayle"],10],
      ["Protea power",["AB de Villiers","Jacques Kallis","Dale Steyn"],10],
      ["Master and the King",["Sachin Tendulkar","Virat Kohli"],6]
    ],
    rules:its=>{
      const c={BAT:0,WK:0,AR:0,BOWL:0}; its.forEach(x=>c[x.t]++); const out=[];
      if(!c.WK) out.push(["No wicketkeeper",-25]);
      if(c.WK>2) out.push(["Too many keepers",-8*(c.WK-2)]);
      const q=(c.WK>=1)+(c.BAT+c.WK>=5)+(c.BOWL>=4)+(c.AR>=1);
      if(q) out.push(["Balanced XI "+q+"/4",q*5]);
      if(c.BOWL+c.AR<5&&its.length>=8) out.push(["Can't bowl 20 overs",-15]);
      // Card stats: [batting, bowling, fielding, power, technique, temperament]
      const avg=(arr,k)=>arr.length?arr.reduce((s,x)=>s+(x.s?x.s[k]:0),0)/arr.length:0;
      const bat=its.filter(x=>x.t==="BAT"||x.t==="WK"), bowl=its.filter(x=>x.t==="BOWL");
      if(bat.length>=4&&avg(bat,0)>=90) out.push(["Top order (batters avg batting 90+)",8]);
      if(bowl.length>=4&&avg(bowl,1)>=90) out.push(["Bowling attack (bowlers avg bowling 90+)",8]);
      if(its.filter(x=>x.s&&x.s[3]>=90).length>=3) out.push(["Big hitters (3+ with power 90+)",6]);
      if(its.length>=8&&avg(its,2)>=86) out.push(["Gun fielders (team avg fielding 86+)",5]);
      if(its.some(x=>x.s&&x.s[5]>=97)) out.push(["Nerves of steel (temperament 97+)",4]);
      const icons=its.filter(x=>x.icon).length;
      if(icons>=3) out.push(["Hall of fame ("+icons+" legends)",6]);
      return out;
    }
  },
  pizza:{
    label:"Pizza", blurb:"Crust, sauce, cheese, toppings. Six slots.", slots:6, kind:"food", base:4, pw:.35, rate:"Taste",
    bots:["Nonna","Luigi","Gordon","Remy","Sofia"],
    cats:{base:["Crust","#ffd9a0"],sauce:["Sauce","#ffb3a7"],cheese:["Cheese","#fff1a8"],topping:["Toppings","#c8f0c2"],finish:["Finish","#d7d3ff"]},
    items:mk([
      ["Neapolitan dough",18,8,"base","🫓"],["Sourdough crust",14,7,"base","🍞"],["Stuffed crust",10,6,"base","🥯"],
      ["Deep dish",12,6,"base","🥧"],["Thin & crispy",8,5,"base","🫓"],["Cauliflower crust",4,2,"base","🥦"],
      ["San Marzano",12,7,"sauce","🍅"],["Vodka sauce",11,7,"sauce","🍸"],["Pesto",10,6,"sauce","🌿"],
      ["Garlic cream",8,5,"sauce","🧄"],["BBQ sauce",5,3,"sauce","🍖"],
      ["Burrata",20,9,"cheese","🧀"],["Buffalo mozzarella",16,8,"cheese","🧀"],["Parmigiano",10,6,"cheese","🧀"],
      ["Gorgonzola",9,5,"cheese","🧀"],["Ricotta",7,5,"cheese","🥛"],["Plastic cheddar",3,2,"cheese","🟧"],
      ["Pepperoni",14,8,"topping","🍕"],["Prosciutto",15,7,"topping","🥓"],["Spicy salami",12,7,"topping","🌶️"],
      ["Sausage",9,6,"topping","🌭"],["Chicken tikka",8,5,"topping","🍗"],["Ham",7,4,"topping","🍖"],
      ["Mushrooms",6,5,"topping","🍄"],["Caramelized onion",6,5,"topping","🧅"],["Jalapeños",5,4,"topping","🌶️"],
      ["Anchovies",5,3,"topping","🐟"],["Pineapple",4,3,"topping","🍍"],["Black olives",4,3,"topping","🫒"],
      ["Truffle oil",22,8,"finish","✨"],["Hot honey",10,7,"finish","🍯"],["Fresh basil",5,5,"finish","🌱"],
      ["Rocket",4,3,"finish","🥬"],["Ranch drizzle",3,2,"finish","🥣"]
    ]),
    combos:[
      ["Margherita",["San Marzano","Buffalo mozzarella","Fresh basil"],12],
      ["Hot honey pepperoni",["Pepperoni","Hot honey"],8],
      ["Truffle shroom",["Truffle oil","Mushrooms"],7],
      ["Pesto & burrata",["Pesto","Burrata"],6],
      ["Hawaiian",["Ham","Pineapple"],5],
      ["Crime scene",["Pineapple","Anchovies"],-10]
    ],
    rules:foodRules({must:[["base","No crust (that's a salad)",-15]],nice:[["sauce","Has sauce",4],["cheese","Has cheese",4]],one:[["base","Extra crust",-8],["sauce","Sauce clash",-4]]})
  },
  burger:{
    label:"Burger", blurb:"Bun, patty, cheese, the works. Six slots.", slots:6, kind:"food", base:4, pw:.35, rate:"Taste",
    bots:["Smash Bro","Chef Bao","Patty","Mac","Rosie"],
    cats:{bun:["Buns","#ffd9a0"],patty:["Patties","#e8b9a0"],cheese:["Cheese","#fff1a8"],topping:["Toppings","#c8f0c2"],sauce:["Sauce","#ffb3a7"]},
    items:mk([
      ["Brioche bun",14,8,"bun","🍞"],["Potato bun",10,7,"bun","🥔"],["Pretzel bun",9,6,"bun","🥨"],
      ["Sesame bun",6,5,"bun","🍔"],["Lettuce wrap",3,2,"bun","🥬"],
      ["Wagyu patty",30,10,"patty","🥩"],["Double patty",24,9,"patty","🍔"],["Smash patty",18,8,"patty","🥩"],
      ["Fried chicken",14,7,"patty","🍗"],["Beyond patty",10,5,"patty","🌱"],["Bean patty",5,3,"patty","🫘"],
      ["Aged cheddar",9,7,"cheese","🧀"],["American cheese",6,7,"cheese","🟨"],["Blue cheese",8,5,"cheese","🧀"],
      ["Pepper jack",7,6,"cheese","🌶️"],["Swiss",7,5,"cheese","🧀"],
      ["Crispy bacon",14,8,"topping","🥓"],["Avocado",10,6,"topping","🥑"],["Fried egg",8,6,"topping","🍳"],
      ["Onion rings",8,6,"topping","🧅"],["Caramelized onions",7,6,"topping","🧅"],["Mushrooms",6,5,"topping","🍄"],
      ["Jalapeños",4,4,"topping","🌶️"],["Pickles",3,5,"topping","🥒"],["Pineapple",4,2,"topping","🍍"],
      ["Tomato",2,3,"topping","🍅"],["Lettuce",2,2,"topping","🥬"],
      ["Truffle mayo",12,7,"sauce","✨"],["Special sauce",8,7,"sauce","🥫"],["Sriracha mayo",6,6,"sauce","🌶️"],
      ["BBQ sauce",5,5,"sauce","🍖"],["Ketchup",2,3,"sauce","🍅"]
    ]),
    combos:[
      ["Classic smash",["Smash patty","American cheese","Pickles","Special sauce"],14],
      ["Truffle shroom",["Truffle mayo","Mushrooms","Swiss"],10],
      ["Bacon cheeseburger",["Crispy bacon","Aged cheddar"],6],
      ["Breakfast burger",["Fried egg","Crispy bacon"],6],
      ["Why?",["Pineapple","Blue cheese"],-8]
    ],
    rules:foodRules({must:[["patty","No patty",-15],["bun","No bun",-8]],nice:[["cheese","Cheesy",4],["sauce","Sauced",3]],one:[["bun","Too many buns",-8]]})
  }
};

/** Score a list of picked card indexes for one market. */
export function score(themeKey, picks) {
  const th = THEMES[themeKey];
  const its = picks.map(i => th.items[i]);
  const base = its.reduce((s, x) => s + x.r, 0);
  const lines = th.rules(its).map(([l, v]) => ({ l, v }));
  const names = new Set(its.map(x => x.n));
  th.combos.forEach(([l, need, v]) => { if (need.every(n => names.has(n))) lines.push({ l, v, combo: 1 }); });
  return { base, lines, total: base + lines.reduce((s, x) => s + x.v, 0) };
}

/** "Vinícius Jr" -> "VJ", "Messi" -> "ME" */
export function initials(n) {
  const w = n.replace(/\./g, "").split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
}

// FIFA-style extras for football: nation flag, six stats, Icon flag.
FUT.decorate(THEMES.football.items);
CRK.decorate(THEMES.cricket.items);

// FIFA-style card settings: stat labels (with an alternative set for keepers) and the card tier.
THEMES.football.card = { labels: FUT.STAT_LABELS, alt: { GK: FUT.GK_LABELS }, tier: FUT.tierOf };
THEMES.cricket.card = { labels: CRK.STAT_LABELS, alt: { WK: CRK.WK_LABELS }, tier: CRK.tierOf };
