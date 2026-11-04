# 総務省「全国地方公共団体コード」の Excel の2枚目（政令指定都市とその区）から、区→親の市の対応表を作ります。
#
# 使い方：python scripts/build-wards.py <ダウンロードした xlsx のパス> <更新日の表記>
#   例）python scripts/build-wards.py code.xlsx "令和6年1月1日更新"
#   Excel は https://www.soumu.go.jp/denshijiti/code.html の「都道府県コード及び市区町村コード」
#
# 出力：public/data/master/wards.json（政令指定都市の区だけ。東京23区は1枚目の市区町村なので入りません）
import datetime
import json
import sys
from pathlib import Path

import openpyxl


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    src, ver = Path(sys.argv[1]), sys.argv[2]
    wb = openpyxl.load_workbook(src, read_only=True)
    rows = [r for r in list(wb.worksheets[1].iter_rows(values_only=True))[1:] if r[0]]
    # 区の名前は「札幌市中央区」の形。市の行が先に並ぶ
    cities = {r[2]: str(r[0]).zfill(6) for r in rows if str(r[2]).endswith("市") and not str(r[2]).endswith("区")}
    items = []
    for r in rows:
        code, name = str(r[0]).zfill(6), str(r[2])
        if code in cities.values():
            continue
        city = next((c for c in sorted(cities, key=len, reverse=True) if name.startswith(c)), None)
        if not city or not name.endswith("区"):
            raise SystemExit(f"親の市が分かりません：{code} {name}")
        items.append({"code": code, "name": name, "city_code": cities[city]})
    head = {
        "source": f"総務省「全国地方公共団体コード」（{ver}）政令指定都市の区",
        "source_url": "https://www.soumu.go.jp/denshijiti/code.html",
        "checked_at": datetime.date.today().isoformat(),
    }
    lines = [f" {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}," for k, v in head.items()]
    body = ",\n".join("  " + json.dumps(x, ensure_ascii=False, separators=(",", ":")) for x in items)
    out = Path(__file__).resolve().parent.parent / "public/data/master/wards.json"
    out.write_text("{\n" + "\n".join(lines) + '\n "items": [\n' + body + "\n ]\n}\n", encoding="utf-8", newline="\n")
    print(out.name, "市", len(cities), "区", len(items))


if __name__ == "__main__":
    main()
