// The members load-tests/seed.sh made, named the way it names them: the same numbers on both sides
// (LOAD_MEMBERS, LOAD_HOT_MEMBERS), so a script knows a member's equipment without asking.
import crypto from 'k6/crypto';

export const MEMBERS = Number(__ENV.LOAD_MEMBERS || 1000);
export const HOT_MEMBERS = Number(__ENV.LOAD_HOT_MEMBERS || 20);
/** The members the writes go to, right after the hot ones; the verdict reconciles exactly these. */
export const WRITERS = Number(__ENV.LOAD_WRITERS || 50);

export type EquipmentType = 'BIKE' | 'TREADMILL' | 'ROWER';
export type Discipline = 'CYCLING' | 'RUNNING' | 'WALKING' | 'ROWING';

/** A seeded member, with the equipment paired to them and the disciplines it records. */
export interface Member {
  n: number;
  id: string;
  equipmentId: string;
  equipmentType: EquipmentType;
  disciplines: readonly Discipline[];
}

const EQUIPMENT_TYPES: readonly EquipmentType[] = ['BIKE', 'TREADMILL', 'ROWER'];
const DISCIPLINES: Record<EquipmentType, readonly Discipline[]> = { BIKE: ['CYCLING'], TREADMILL: ['RUNNING', 'WALKING'], ROWER: ['ROWING'] };

/** seed.sh's ids: the md5 of a name, written as a UUID with version 7's and the variant's digits. */
export function uuidFrom(name: string): string {
  const hex = crypto.md5(name, 'hex').split('');
  hex[12] = '7';
  hex[16] = '8';
  const h = hex.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function member(n: number): Member {
  const equipmentType = EQUIPMENT_TYPES[n % 3];
  return {
    n,
    id: `load-${String(n).padStart(4, '0')}@example.com`,
    equipmentId: uuidFrom(`load-equipment-${n}`),
    equipmentType,
    disciplines: DISCIPLINES[equipmentType],
  };
}

const between = (first: number, last: number) => first + Math.floor(Math.random() * (last - first + 1));

export const anyMember = () => member(between(1, MEMBERS));
export const anyWriter = () => member(between(HOT_MEMBERS + 1, HOT_MEMBERS + WRITERS));
export const writers = () => Array.from({ length: WRITERS }, (_, i) => member(HOT_MEMBERS + 1 + i));
