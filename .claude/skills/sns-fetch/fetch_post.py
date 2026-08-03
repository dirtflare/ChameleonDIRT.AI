#!/usr/bin/env python3
"""SNS投稿を本文＋画像まで丸ごと取り出す。

usage: fetch_post.py <url> [outdir]

X(Twitter): 公開JSON API(fxtwitter)経由。通常ツイート/スレッド/長文Articleに対応し、
本文・埋め込みmarkdown・画像URLを出現順に復元する。
Instagram:  埋め込みエンドポイント経由でキャプションと画像URLを取得する。

出力: outdir/content.md（本文、画像は [IMAGE n: path] で位置を示す）
      outdir/img_NN.jpg（全画像）
"""
import json
import os
import re
import subprocess
import sys
import urllib.parse

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def curl(url, binary=False, headers=None, ua=UA):
    cmd = ["curl", "-sSL", "--max-time", "60", "-A", ua]
    for h in headers or []:
        cmd += ["-H", h]
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"curl failed for {url}: {r.stderr.decode()[:200]}")
    return r.stdout if binary else r.stdout.decode("utf-8", "replace")


def save_images(urls, outdir):
    """画像を順に落とす。戻り値は本文から参照するための相対パス一覧。"""
    paths = []
    for i, u in enumerate(urls):
        ext = os.path.splitext(urllib.parse.urlparse(u).path)[1] or ".jpg"
        p = os.path.join(outdir, f"img_{i:02d}{ext}")
        try:
            data = curl(u + ("?name=orig" if "pbs.twimg.com" in u else ""), binary=True)
            with open(p, "wb") as f:
                f.write(data)
            paths.append(p)
        except RuntimeError:
            paths.append(None)
    return paths


# ---------------------------------------------------------------- X / Twitter

def fetch_x(url, outdir):
    m = re.search(r"(?:twitter|x)\.com/([^/]+)/status/(\d+)", url)
    if not m:
        raise SystemExit("X の status URL として解釈できない")
    handle, sid = m.groups()
    tw = json.loads(curl(f"https://api.fxtwitter.com/{handle}/status/{sid}"))["tweet"]

    img_urls, lines = [], []
    lines.append(f"# {tw['author']['name']} (@{tw['author']['screen_name']})")
    lines.append(f"posted: {tw['created_at']}  /  {tw['url']}")
    lines.append("")

    art = tw.get("article")
    if art:
        # 長文Article: DraftJS 形式。ブロックを順に走査し、
        # atomic ブロックは entityMap を引いて画像/markdown に解決する。
        lines.append(f"## {art['title']}\n")
        ents = {e["key"]: e["value"] for e in art["content"].get("entityMap", [])}
        media = {
            me["media_id"]: me["media_info"]["original_img_url"]
            for me in art.get("media_entities", [])
        }
        for blk in art["content"]["blocks"]:
            ty, text = blk.get("type", ""), blk.get("text", "")
            if ty == "atomic":
                # atomic の中身は本文テキストではなく entity 側にある
                for r in blk.get("entityRanges", []):
                    ent = ents.get(str(r["key"]), {})
                    if ent.get("type") == "MEDIA":
                        for mi in ent["data"]["mediaItems"]:
                            u = media.get(mi["mediaId"])
                            if u:
                                img_urls.append(u)
                                lines.append(f"[IMAGE {len(img_urls) - 1}]")
                    elif ent.get("type") == "MARKDOWN":
                        lines.append(ent["data"]["markdown"])
                continue
            prefix = {
                "header-one": "# ", "header-two": "## ", "header-three": "### ",
                "unordered-list-item": "- ", "ordered-list-item": "1. ",
                "blockquote": "> ", "code-block": "    ",
            }.get(ty, "")
            lines.append(prefix + text)
    else:
        lines.append(tw.get("text") or tw.get("raw_text", {}).get("text", ""))

    for m_ in (tw.get("media") or {}).get("all", []):
        u = m_.get("url")
        if u and m_.get("type") == "photo":
            img_urls.append(u)
            lines.append(f"[IMAGE {len(img_urls) - 1}]")

    return "\n".join(lines), img_urls


# ------------------------------------------------------------------ Instagram

def fetch_instagram(url, outdir):
    m = re.search(r"instagram\.com/(?:p|reel|tv)/([\w-]+)", url)
    if not m:
        raise SystemExit("Instagram の投稿 URL として解釈できない")
    code = m.group(1)
    lines, img_urls = [f"# Instagram /p/{code}", ""], []

    # 公開の埋め込みページ。ログイン不要で、埋め込み用の GraphQL 応答が
    # contextJSON という二重エンコードされた文字列として素で入っている。
    # UA は素朴なものに固定する。Chrome のフルUAを送ると JS 描画前提の別ページが
    # 返り、contextJSON が含まれない。
    html = curl(f"https://www.instagram.com/p/{code}/embed/captioned/", ua="Mozilla/5.0")

    media = {}
    i = html.find('"contextJSON"')
    if i >= 0:
        # 値は JSON を JSON 文字列に入れた二重エンコード。正規表現だとエスケープを
        # 取りこぼすので、デコーダに文字列1個だけ読ませてから中身を parse する。
        try:
            inner, _ = json.JSONDecoder().raw_decode(html, html.index(":", i) + 1)
            media = json.loads(inner).get("gql_data", {}).get("shortcode_media") or {}
        except (ValueError, KeyError):
            media = {}

    owner = (media.get("owner") or {}).get("username")
    if owner:
        lines[0] += f"  by @{owner}"

    cap_edges = (media.get("edge_media_to_caption") or {}).get("edges") or []
    if cap_edges:
        lines += ["## caption", cap_edges[0]["node"]["text"], ""]
    else:
        # 埋め込みHTML側のキャプション要素にフォールバックする
        cap = re.search(r'class="Caption"(.*?)</div>', html, re.S)
        if cap:
            t = re.sub(r"<br\s*/?>", "\n", cap.group(1))
            lines += ["## caption", html_unescape(re.sub(r"<[^>]+>", "", t)).strip(), ""]

    # カルーセルは edge_sidecar_to_children に全スライドが並ぶ。単体投稿は自分自身。
    kids = (media.get("edge_sidecar_to_children") or {}).get("edges")
    nodes = [e["node"] for e in kids] if kids else ([media] if media else [])
    for n in nodes:
        u = n.get("display_url")
        if u:
            img_urls.append(u)
    if not img_urls:  # JSON が取れなければ CDN の実メディアURLだけ拾う
        seen = set()
        for u in re.findall(r'https://scontent[^"\'\\ ]*?/v/t51\.[^"\'\\ ]*', html):
            u = u.replace("\\u0026", "&").replace("&amp;", "&").split("?")[0]
            if u not in seen:
                seen.add(u)
                img_urls.append(u)

    if not img_urls:
        lines.append("**画像を取得できなかった。スクリーンショットを渡してほしい。**")
    else:
        lines.append(f"## slides ({len(img_urls)})")
        lines += [f"[IMAGE {i}]" for i in range(len(img_urls))]
    return "\n".join(lines), img_urls


def html_unescape(s):
    import html
    return html.unescape(s)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    url = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else "post_out"
    os.makedirs(outdir, exist_ok=True)

    if re.search(r"(twitter|x)\.com/", url):
        body, imgs = fetch_x(url, outdir)
    elif "instagram.com" in url:
        body, imgs = fetch_instagram(url, outdir)
    else:
        raise SystemExit("X か Instagram の URL を渡すこと")

    paths = save_images(imgs, outdir)
    for i, p in enumerate(paths):
        body = body.replace(f"[IMAGE {i}]", f"[IMAGE {i}: {p or 'DOWNLOAD FAILED'}]")

    out = os.path.join(outdir, "content.md")
    with open(out, "w") as f:
        f.write(body)
    print(f"{out}  ({len(body)} chars, {sum(p is not None for p in paths)}/{len(paths)} images)")


if __name__ == "__main__":
    main()
