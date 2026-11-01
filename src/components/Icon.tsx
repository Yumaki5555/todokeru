// アイコン（すべて同じ線の太さ・角の丸めで描く。色は文字色を受け継ぐ）
import type { IconName } from '../types';

const PATHS: Record<IconName, string[]> = {
  phone: ['M6.6 3.5h2.6l1.3 4.2-2 1.5a12 12 0 0 0 6.3 6.3l1.5-2 4.2 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z'],
  mail: ['M5 5.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M3.5 7.5 12 13l8.5-5.5'],
  comment: ['M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z', 'M14 3v5h5', 'M8.5 13h7', 'M8.5 16.5h4.5'],
  petition: ['M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z', 'M14 3v5h5', 'm8.5 14.5 2.5 2.5 4.5-4.5'],
  folder: ['M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z', 'M8.5 13h7'],
  signature: ['M4 20h16', 'M14.5 4.5l3 3L9 16l-4 1 1-4z'],
  search: ['M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z', 'M15.5 15.5 21 21'],
  book: ['M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2z', 'M12 6.5v14'],
  route: ['M12 3v2.5', 'M12 10.5V13', 'M12 18v3', 'M8 21h8', 'M5 5.5h10l2.5 2.5L15 10.5H5z', 'M19 13H9l-2.5 2.5L9 18h10z'],
  building: ['M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21', 'M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21', 'M3 21h18', 'M8.5 7.5h3', 'M8.5 11.5h3', 'M8.5 15.5h3'],
  assembly: ['M3.5 9.5 12 4l8.5 5.5z', 'M6 12v6', 'M10 12v6', 'M14 12v6', 'M18 12v6', 'M3.5 20.5h17'],
  check: ['m5 12.5 4.5 4.5L19 7'],
  copy: ['M10 8h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M15.5 8V5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H9'],
  'arrow-up': ['M12 19V5', 'm5.5 11.5 6.5-6.5 6.5 6.5'],
  'arrow-right': ['M5 12h14', 'm12.5 5.5 6.5 6.5-6.5 6.5'],
  'arrow-left': ['M19 12H5', 'M11.5 5.5 5 12l6.5 6.5'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 11v6', 'M12 7.5v.01'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={'icon' + (className ? ' ' + className : '')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
