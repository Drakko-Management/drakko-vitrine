// Les valeurs sont celles des enums `Trade` et `TeamSize` du back (03-back/prisma/schema.prisma) : le serveur
// refuse toute autre valeur. Ne changer un libellé qu'ici ; changer une valeur suppose de changer le back.
export const TRADES = [
  { value: 'LANDSCAPER', label: 'Paysagiste' },
  { value: 'PLUMBER', label: 'Plombier' },
  { value: 'ELECTRICIAN', label: 'Électricien' },
  { value: 'PAINTER', label: 'Peintre' },
  { value: 'MASON', label: 'Maçon' },
  { value: 'ROOFER', label: 'Couvreur' },
  { value: 'OTHER', label: 'Autre' },
] as const;

export const TEAM_SIZES = [
  { value: 'SOLO', label: 'Seul' },
  { value: 'SMALL', label: '2 à 5' },
  { value: 'MEDIUM', label: '6 à 15' },
  { value: 'LARGE', label: 'Plus de 15' },
] as const;

export type Trade = (typeof TRADES)[number]['value'];
export type TeamSize = (typeof TEAM_SIZES)[number]['value'];
