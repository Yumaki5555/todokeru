// 窓口検索で探せる相手（国の機関・都道府県・市区町村・議会）をアイコンで並べる
import type { IconName } from '../types';
import { Icon } from './Icon';

export const KINDS: { icon: IconName; label: string }[] = [
  { icon: 'landmark', label: '国の機関' },
  { icon: 'map', label: '都道府県' },
  { icon: 'building', label: '市区町村' },
  { icon: 'assembly', label: '議会' },
];

export function KindChips({ className }: { className?: string }) {
  return (
    <ul className={'kind-chips' + (className ? ' ' + className : '')}>
      {KINDS.map((k) => (
        <li key={k.label}>
          <Icon name={k.icon} />
          {k.label}
        </li>
      ))}
    </ul>
  );
}
