import { MatrimonyProfile } from '../types';
import { BOOKLET_GROOMS_PART1 } from './bookletGroomsPart1';
import { BOOKLET_GROOMS_PART2 } from './bookletGroomsPart2';
import { BOOKLET_GROOMS_PART3 } from './bookletGroomsPart3';

export const BOOKLET_GROOMS: MatrimonyProfile[] = [
  ...BOOKLET_GROOMS_PART1,
  ...BOOKLET_GROOMS_PART2,
  ...BOOKLET_GROOMS_PART3
];
