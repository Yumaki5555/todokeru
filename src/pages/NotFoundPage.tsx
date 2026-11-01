// 見つからないページ
import { PageEndNav } from '../components/Links';
import { PageHead } from '../components/PageHead';

export function NotFoundPage() {
  return (
    <div className="wrap wrap-narrow page">
      <PageHead title="ページが見つかりません" />
      <p>お探しのページは、移動したか、まだ作られていない可能性があります。上のメニューか、トップページからお探しください。</p>
      <PageEndNav />
    </div>
  );
}
