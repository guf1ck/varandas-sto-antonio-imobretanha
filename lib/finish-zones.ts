// Bathroom interiors traced from each original sheet at 1400px width.
// These visual finish masks do not alter walls, openings or collision geometry.
const rect=(x:number,y:number,w:number,h:number)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export const bathroomZones:Record<string,number[][][]>={
 A:[rect(365,307,103,97),rect(475,307,135,97)],
 B:[rect(913,368,90,123),rect(913,498,86,96)],
 C:[rect(333,353,90,124),rect(123,383,87,94)],
 D:[rect(918,360,90,122),rect(918,490,86,94)],
 E:[rect(338,346,90,123),rect(128,375,87,94)],
 F:[rect(907,353,90,122),rect(907,483,86,94)],
 G:[rect(327,339,90,123),rect(117,368,87,94)],
 H:[rect(894,503,69,88),rect(1054,522,66,69)],
 I:[rect(307,444,68,72),rect(307,523,68,91)],
 J:[rect(949,381,89,121),rect(1162,408,88,94)],
 L:[rect(378,378,89,125),rect(166,408,86,94)],
 M:[rect(979,367,89,121),rect(1193,394,88,94)],
 N:[rect(409,364,89,125),rect(197,394,86,94)],
 O:[rect(232,364,122,90),rect(232,461,92,84)],
 P:[[[869,425],[955,414],[963,478],[877,489]],[[877,496],[958,485],[966,552],[885,563]]],
 Q:[[[288,309],[356,300],[364,367],[296,376]],[[364,299],[451,288],[459,355],[372,366]]],
};
for(const [id,base,dx,dy] of [['R','P',24,-17],['T','P',50,-41],['S','Q',24,-17],['U','Q',50,-41]] as const){bathroomZones[id]=bathroomZones[base].map(zone=>zone.map(([x,y])=>[x+dx,y+dy]));}
