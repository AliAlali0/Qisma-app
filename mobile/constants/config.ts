export const BASE_URL = 'http://192.168.8.2:3000';
export const API_URL = `${BASE_URL}/api/divide-teams`;
export const PLAYERS_API_URL = `${BASE_URL}/api/players`;
export const DRAFT_BALANCE_URL = `${BASE_URL}/api/draft-balance`;
export const MATCHES_API_URL = `${BASE_URL}/api/matches`;
export const TOURNAMENTS_API_URL = `${BASE_URL}/api/tournaments`;
export const TEAMS_API_URL = `${BASE_URL}/api/teams`;
export const AUTH_API_URL = `${BASE_URL}/api/auth/login`;

export const POSITIONS_LIST = ['حارس', 'دفاع', 'وسط', 'هجوم'];

export const KIT_COLORS = [
  { hex: '#16A34A', label: 'أخضر', emoji: '🟢' },
  { hex: '#2563EB', label: 'أزرق', emoji: '🔵' },
  { hex: '#DC2626', label: 'أحمر', emoji: '🔴' },
  { hex: '#D97706', label: 'ذهبي', emoji: '🟡' },
  { hex: '#7C3AED', label: 'بنفسجي', emoji: '🟣' },
  { hex: '#1F2937', label: 'أسود', emoji: '⚫' },
];

export const GUEST_TEMPLATE = `ملعب النخبة الكبير ⚽
1- أحمد الصليح (92) [هجوم]
2- محمد تقي (88) [دفاع]
3- بو هادي (90) [هجوم]
4- علي عدنان (85) [دفاع]
5- سلمان (82) [وسط]
6- باسل (78) [دفاع]
7- حسن (75) [وسط]
8- حسين (74) [دفاع]
9- فهد (83) [وسط]
10- ناصر (80) [هجوم]
11- طارق (77) [دفاع]
12- إبراهيم (76) [وسط]
13- ماجد (81) [وسط]
14- راشد (79) [دفاع]
15- عبد الله (84) [هجوم]
16- تركي (73) [وسط]
🧤حراس المرمى🧤
17- منتظر (86)
18- موسى جعفر (89)

---
قائمة الانتظار / الاحتياط:
19- نايف (78) [وسط]
20- سامي (70) [دفاع]
21- خالد (72) [هجوم]
22- زياد (68) [وسط]`;