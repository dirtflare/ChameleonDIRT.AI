# Prompt examples

Prompts are written in Japanese, matching the app's interface. Copy one into the prompt field,
or add several and generate them together — each prompt produces its own variation from the same
base image.

Every prompt is combined with a fixed instruction to preserve existing text, logos, and coupon
codes, and to keep the overall layout proportions. You do not need to ask for that yourself.

## Style transfer

Change the rendering style while keeping the composition.

| Prompt | Effect |
| --- | --- |
| `全体を水彩画風のタッチに。` | Soft watercolor treatment |
| `全体をレトロな80年代風の広告デザインに変更。` | Retro poster styling |
| `線画とフラットな塗りのイラスト調にする。` | Flat illustration |
| `落ち着いたマットな質感のフィルムグレインを加える。` | Muted analog film look |
| `モノクロにして、コントラストを強めにする。` | High-contrast monochrome |

## Background changes

Replace or adjust the surroundings while leaving the subject alone.

| Prompt | Effect |
| --- | --- |
| `背景を未来的な夜の街並みに変更。` | Night cityscape |
| `背景をミニマルな単色（#f0f0f0）にする。` | Flat neutral backdrop |
| `背景を明るい屋外のカフェテラスにする。` | Outdoor setting |
| `背景を白いスタジオ背景にし、柔らかい影を落とす。` | Studio product shot |
| `広告の季節を夏から冬に変えて、雪景色にする。` | Seasonal change |

Turning on **背景の透過** in the style presets asks for a transparent background instead, and is
usually better than describing it in a prompt.

## Object and detail refinement

Adjust or add specific elements.

| Prompt | Effect |
| --- | --- |
| `商品に桜の花びらが舞い散るエフェクトを追加。` | Decorative particle effect |
| `商品を宙に浮かせ、光の軌跡を追加する。` | Floating product with light trails |
| `メインの商品を高級腕時計に交換。` | Swap the featured product |
| `商品の表面の光沢と反射を強調する。` | Emphasize material finish |
| `手前に季節の小物を控えめに配置する。` | Add foreground props |

## Combining with the style presets

The controls panel appends its own instructions, so prompts stay shorter:

- **ブランドカラー** injects a color instruction into every prompt.
- **テクスチャ** adds a fine texture overlay.
- **個別カラー指定** sets colors per category (hair, face, body, shoes, props, accessories,
  background). Toggle off the categories you do not want touched — enabled categories are all
  sent, and specifying colors for parts you did not intend to change is the usual cause of
  unexpected results.

## Writing your own

- **One change per prompt.** Add several prompts rather than stacking requests into one — that
  is what the batch generation is for, and it makes it obvious which instruction caused which
  result.
- **Say what to keep**, not only what to change, when a detail matters to you.
- **Name colors in hex** (`#f0f0f0`) when you need precision.
- **Expect variation.** The same prompt does not reproduce the same image on a re-run.

Keep examples generic. Do not use prompts that reproduce copyrighted characters, real brand
assets, or identifiable people.
