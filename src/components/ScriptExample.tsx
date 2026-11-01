// マニュアルの中の台本の例（読むためのもの。1行ずつのコピーはしない）
import type { Script } from '../types';

export function ScriptExample({ script }: { script: Script }) {
  return (
    <figure className="script">
      <figcaption className="script-label">{script.label}</figcaption>
      <p className="script-text">「{script.text}」</p>
      {script.note && <p className="script-note">{script.note}</p>}
    </figure>
  );
}
