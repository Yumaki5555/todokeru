// 「3分でわかる」のページ（#/sanpun）：4つのSTEP → 声を届ける前に知っておきたいこと
// 以前はトップの中にあった（#/?s=sanpun）。トップに「何をしたいですか？」を置いたので、同じ選択肢が1ページに2回出ないよう分けた
import { BeforeYouSend, ThreeMinutes } from '../components/ThreeMinutes';
import { PageHead } from '../components/PageHead';
import { PageEndNav } from '../components/Links';

export function ThreeMinutesPage() {
  return (
    <div className="wrap page sanpun-page">
      <PageHead title="3分でわかる" sub="4つのステップで、声の届け方をつかむ" />
      <ThreeMinutes />
      <BeforeYouSend />
      <PageEndNav />
    </div>
  );
}
