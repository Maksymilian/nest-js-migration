import { Discipline } from '../../../workouts/domain/values/discipline.js';
import { UnknownEquipmentType } from '../errors/unknown-equipment-type.js';
import { EquipmentType } from './equipment-type.js';

describe('EquipmentType', () => {
  it.each([
    ['BIKE', ['CYCLING']],
    ['TREADMILL', ['RUNNING', 'WALKING']],
    ['ROWER', ['ROWING']],
  ])('%s supports exactly %j', (type, supported) => {
    const equipmentType = EquipmentType.from(type);
    for (const discipline of ['CYCLING', 'RUNNING', 'WALKING', 'ROWING']) {
      expect(equipmentType.supports(Discipline.from(discipline))).toBe(supported.includes(discipline));
    }
  });

  it('refuses an unknown type', () => {
    expect(() => EquipmentType.from('ELLIPTICAL')).toThrow(UnknownEquipmentType);
  });
});
