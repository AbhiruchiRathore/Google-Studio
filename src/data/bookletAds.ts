import { BusinessAd } from '../types';
import { BOOKLET_ADS_PART1 } from './bookletAdsPart1';
import { BOOKLET_ADS_PART2 } from './bookletAdsPart2';

export const BOOKLET_ADS: BusinessAd[] = [
  ...BOOKLET_ADS_PART1,
  ...BOOKLET_ADS_PART2
];
