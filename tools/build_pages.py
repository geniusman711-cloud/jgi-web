#!/usr/bin/env python3
"""Builds the site pages from tools/pages/*.html.

Each page shares one head, header, footer and script list, so edit those here
and the page bodies in tools/pages/, then run:  python3 tools/build_pages.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'pages')
V = '39'
# public address of the site; change to the real domain once it is connected, then rebuild
SITE = 'https://geniusman711-cloud.github.io/jgi-web/'  # cache-busting version for shared css/js

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>'

# order = menu order and the "next page" chain
PAGES = [
    dict(file='operasional', nav='t2', label='Operasional', title='Operasional', h1='p12', lead='p13', img='assets/jgi-tongkang-jetty.jpg',
         desc='Alur operasi JGI dari tambang, hauling, stockpile, jetty hingga transhipment ke anchorage JGI.', js=['route-map-data.js?v=4', 'route-map.js?v=16']),
    dict(file='pengembangan', nav='p1', label='Pengembangan', title='Rencana Pengembangan', h1='p14', lead='p15', img='assets/plan-terminal-coal.jpg',
         desc='Rencana terminal kapal curah 50.000–100.000 DWT dan dermaga pemuatan langsung dengan konveyor.', js=['conveyor.js?v=5']),
    dict(file='produk', nav='t3', label='Produk', title='Produk Batubara', h1='p16', lead='p17', img='assets/jgi-sampel-batubara.jpg',
         desc='Batubara thermal JGI GAR 4.200–4.800 kcal/kg dengan spesifikasi khas untuk industri dan pembangkit listrik.', js=[]),
    dict(file='komitmen', nav='t4', label='Komitmen', title='Komitmen', h1='p18', lead='p19', img='assets/jgi-safety-talk.jpg',
         desc='Keselamatan kerja, pengelolaan lingkungan dan program CSR PT Jayakhisma Globe Indonesia.', js=[]),
    dict(file='galeri', nav='x1', label='Galeri', title='Galeri', h1='p20', lead='p21', img='assets/jgi-coal-getting-pit.jpg',
         desc='Dokumentasi operasi PT Jayakhisma Globe Indonesia dari pit hingga pengapalan.', js=[]),
    dict(file='kontak', nav='p5', label='Kontak Kami', title='Kontak & Pemesanan', h1='p22', lead='p23', img='assets/hero-mining-night.jpg',
         desc='Hubungi tim komersial PT Jayakhisma Globe Indonesia atau kirim form pemesanan batubara.', js=['qr.js?v=1', 'order-qr.js?v=3']),
]

# page-level copy (menu, banners, home cards); written to page-copy.js
P_COPY = {
 'p1': ('Pengembangan', 'Development', '发展规划'),
 'p2': ('Beranda', 'Home', '首页'),
 'p3': ('Selanjutnya', 'Next', '下一页'),
 'p4': ('Sebelumnya', 'Previous', '上一页'),
 'p10': ('Perusahaan &amp; legalitas.', 'Company &amp; permits.', '公司与许可。'),
 'p11': ('Profil, perizinan, dan wilayah IUP PT Jayakhisma Globe Indonesia di Tanjung Mangkalihat, Kutai Timur.', 'Profile, permits and the IUP concession of PT Jayakhisma Globe Indonesia at Tanjung Mangkalihat, East Kutai.', 'PT Jayakhisma Globe Indonesia 的公司简介、许可证及位于东古泰 Tanjung Mangkalihat 的矿权区域。'),
 'p12': ('Dari tambang ke pengapalan.', 'From mine to shipment.', '从矿区到装运。'),
 'p13': ('Lima tahap operasi JGI di peta asli: tambang, hauling, stockpile, jetty, hingga transhipment ke anchorage.', 'Five stages of JGI operations on the real map: mine, hauling, stockpile, jetty and transhipment to the anchorage.', '在真实地图上了解 JGI 的五个运营环节：矿区、运输、堆场、码头及过驳至锚地。'),
 'p14': ('Kapasitas untuk tumbuh.', 'Capacity to grow.', '为增长预留产能。'),
 'p15': ('Rencana terminal kapal curah 50.000–100.000 DWT dan dermaga pemuatan langsung dengan konveyor.', 'A planned terminal for 50,000–100,000 DWT bulk carriers and a direct-loading conveyor berth.', '规划中的 5–10 万载重吨散货船码头及输送机直接装船泊位。'),
 'p16': ('Batubara thermal GAR 4.200–4.800.', 'Thermal coal, GAR 4,200–4,800.', '动力煤 GAR 4,200–4,800。'),
 'p17': ('Spesifikasi khas batubara JGI untuk kebutuhan industri dan pembangkit listrik.', 'Typical specifications of JGI coal for industry and power generation.', 'JGI 煤炭的典型规格，适用于工业和发电。'),
 'p18': ('Tanggung jawab di setiap langkah.', 'Responsibility in every step.', '每一步都负责任。'),
 'p19': ('Keselamatan kerja, pengelolaan lingkungan, dan program bersama masyarakat sekitar tambang.', 'Workplace safety, environmental management and programmes with communities around the mine.', '作业安全、环境管理以及与矿区周边社区共同开展的项目。'),
 'p20': ('Operasi dalam gambar.', 'Operations in pictures.', '运营实景。'),
 'p21': ('Dokumentasi perusahaan dari pit hingga pengapalan. Klik foto untuk memperbesar.', 'Company photographs from pit to shipment. Click a photo to enlarge.', '从矿坑到装运的公司实景照片。点击照片可放大。'),
 'p22': ('Mari terhubung.', 'Let’s connect.', '保持联系。'),
 'p23': ('Hubungi tim komersial JGI atau kirim pemesanan batubara melalui form PO.', 'Contact the JGI commercial team or place a coal order with the PO form.', '联系 JGI 商务团队，或通过订购表提交煤炭订单。'),
 'p30': ('JELAJAHI JGI', 'EXPLORE JGI', '了解 JGI'),
 'p31': ('Semua tentang JGI,<br>dalam satu klik.', 'Everything about JGI,<br>one click away.', '关于 JGI 的一切，<br>一键即达。'),
 'p32': ('Profil, legalitas, dan wilayah IUP.', 'Profile, permits and IUP concession.', '公司简介、许可证与矿权区域。'),
 'p33': ('Peta operasi dan lima tahap rantai pasok.', 'Operations map and the five-stage supply chain.', '运营地图与五个供应链环节。'),
 'p34': ('Rencana terminal dan konveyor ke kapal.', 'Planned terminal and ship-loading conveyor.', '规划中的码头与装船输送机。'),
 'p35': ('Spesifikasi batubara GAR 4.200–4.800.', 'Coal specifications, GAR 4,200–4,800.', '煤炭规格 GAR 4,200–4,800。'),
 'p36': ('Keselamatan, lingkungan, dan CSR.', 'Safety, environment and CSR.', '安全、环境与社会责任。'),
 'p37': ('Foto operasi dan kegiatan.', 'Operations and community photos.', '运营与社区活动照片。'),
 'p5': ('Kontak Kami', 'Contact Us', '联系我们'),
 'p38': ('Pesan Batubara', 'Order Coal', '订购煤炭'),
 'p39': ('Setiap bagian punya halaman sendiri, jadi mudah dibaca dan dibagikan.', 'Each topic has its own page, easy to read and to share.', '每个主题都有独立页面，便于阅读和分享。'),
 'p40': ('Lihat alur operasi', 'See the operations flow', '查看运营流程'),
}

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from copy_extra import EXTRA_COPY
P_COPY.update(EXTRA_COPY)

def fill(html):
    return re.sub(r'<span data-i18n="(p\d+)"></span>', lambda m: f'<span data-i18n="{m.group(1)}">{P_COPY[m.group(1)][0]}</span>', html)

COMPANY = dict(file='index', nav='t1', label='Perusahaan', lead='p11')
MENU = [COMPANY] + PAGES
COMMON_JS = ['translations.js?v=6', 'site-config.js?v=4', 'extra-translations.js?v=19', 'zh-translations.js?v=7', 'page-copy.js?v=1', 'app.js?v=7', 'enhance.js?v=13']


IMG = json.load(open(os.path.join(ROOT, 'tools', 'img-meta.json')))
FULL_BLEED = ('hero-media', 'band-media', 'page-hero')


def optimize_images(html):
    """Serve WebP (with an 800px variant for phones) instead of the original JPGs."""
    def img(m):
        tag = m.group(0)
        name = m.group(1)
        if name not in IMG:
            return tag
        w = IMG[name][0]
        tag = tag.replace(f'src="assets/{name}.jpg"', f'src="assets/{name}.webp"')
        if len(IMG[name]) > 2 and 'srcset=' not in tag:
            ctx = html[max(0, m.start() - 220):m.start()]
            sizes = '100vw' if any(c in ctx for c in FULL_BLEED) else '(max-width:700px) 100vw, 50vw'
            tag = tag.replace('<img ', f'<img srcset="assets/{name}-800.webp 800w, assets/{name}.webp {w}w" sizes="{sizes}" ', 1)
        if 'decoding=' not in tag:
            tag = tag.replace('<img ', '<img decoding="async" ', 1)
        return tag
    html = re.sub(r'<img [^>]*src="assets/([a-z0-9-]+)\.jpg"[^>]*>', img, html)
    html = re.sub(r'data-full="assets/([a-z0-9-]+)\.jpg"', lambda m: f'data-full="assets/{m.group(1)}.webp"' if m.group(1) in IMG else m.group(0), html)
    html = html.replace('src="assets/jgi-logo-transparent.png" width="82" height="64"', 'src="assets/jgi-logo-164.webp" width="82" height="64"')
    return html


def head(title, desc, url):
    full = 'JGI — Jayakhisma Globe Indonesia' if not title else title + ' · JGI — Jayakhisma Globe Indonesia'
    canon = SITE if url == 'index' else f'{SITE}{url}.html'
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "PT Jayakhisma Globe Indonesia", "item": SITE},
        {"@type": "ListItem", "position": 2, "name": title, "item": canon}]}
    ld = {"@context": "https://schema.org", "@type": "Organization", "name": "PT Jayakhisma Globe Indonesia", "alternateName": "JGI",
          "url": SITE, "logo": SITE + "assets/icon-512.png", "email": "pt.jayakhisma@gmail.com", "areaServed": "Worldwide", "address": {"@type": "PostalAddress", "streetAddress": "Epicentrum Walk Office Suites, Jl. H. R. Rasuna Said, Kuningan",
                                                          "addressLocality": "Jakarta Selatan", "postalCode": "12940", "addressCountry": "ID"}}
    return ('<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{full}</title><meta name="description" content="{desc}"><meta name="theme-color" content="#0c171e">'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="JGI"><meta property="og:title" content="{full}">'
            f'<meta property="og:description" content="{desc}"><meta property="og:locale" content="id_ID"><meta name="twitter:card" content="summary_large_image">'
            f'<link rel="canonical" href="{canon}"><meta property="og:url" content="{canon}"><meta property="og:image" content="{SITE}assets/og-{url}.jpg">'
            '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale:alternate" content="en_US"><meta property="og:locale:alternate" content="zh_CN">'
            f'<meta name="twitter:image" content="{SITE}assets/og-{url}.jpg">'
            '<link rel="icon" href="favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png"><link rel="manifest" href="site.webmanifest">'
            + '<script type="application/ld+json">' + json.dumps(ld if not title else crumbs, ensure_ascii=False, separators=(',', ':')) + '</script>' +
            "<script>try{let x=localStorage.getItem('jgi-theme');document.documentElement.dataset.theme=['light','dark'].includes(x)?x:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}document.documentElement.classList.add('js')</script>"
            '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">'
            f'<link rel="stylesheet" href="style.css?v=20261106-polish"><link rel="stylesheet" href="enhance.css?v={V}"></head><body data-page="{url}">\n')


def header(cur):
    links = ''.join(
        f'<a href="{p["file"]}.html"' + (' class="active" aria-current="page"' if p['file'] == cur else '') + f'><span data-i18n="{p["nav"]}">{p["label"]}</span></a>'
        for p in MENU)
    links += '<a class="nav-mobile-contact" href="pesan.html"><span data-i18n="p38">Pesan Batubara</span></a>'
    return ('<div class="scroll-progress" aria-hidden="true"></div>\n<a class="skip" href="#utama"><span data-i18n="t0">Langsung ke konten</span></a>\n'
            '<header class="site-header"><a class="brand" href="index.html" aria-label="JGI — PT Jayakhisma Globe Indonesia"><img src="assets/jgi-logo-transparent.png" width="82" height="64" alt="JGI Coal Mining"><span>JAYAKHISMA<small>GLOBE INDONESIA</small></span></a>'
            f'<nav id="main-nav" aria-label="Navigasi utama">{links}</nav>'
            '<div class="header-controls"><div class="language-switch" aria-label="Bahasa / Language"><button type="button" data-language="id" aria-pressed="true">ID</button><button type="button" data-language="en" aria-pressed="false">EN</button><button type="button" data-language="zh" aria-pressed="false">中文</button></div>'
            '<button class="theme-toggle" type="button" aria-label="Ganti tema" aria-pressed="false"><span class="sun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1"/></svg></span><span class="moon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></svg></span></button>'
            f'<a class="button compact header-contact" href="pesan.html"><span data-i18n="p38">Pesan Batubara</span> {ARROW}</a>'
            '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Buka menu"><span></span><span></span></button></div></header>\n')


def page_hero(p):
    return (f'<section class="page-hero photo-band" aria-labelledby="page-title"><div class="band-media" aria-hidden="true"><img src="{p["img"]}" alt="" fetchpriority="high"></div><div class="band-shade"></div>'
            '<div class="wrap band-inner page-hero-inner"><nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">JGI</a><span aria-hidden="true">/</span>'
            f'<span aria-current="page"><span data-i18n="{p["nav"]}">{p["label"]}</span></span></nav>'
            f'<h1 id="page-title"><span data-i18n="{p["h1"]}"></span></h1><p><span data-i18n="{p["lead"]}"></span></p></div></section>\n')


def page_next(i):
    prev = PAGES[i - 1] if i > 0 else None
    nxt = PAGES[i + 1] if i + 1 < len(PAGES) else None
    out = '<nav class="page-next wrap" aria-label="Halaman lain">'
    out += (f'<a class="pn-prev" href="{prev["file"]}.html"><span class="pn-label">{BACK} <span data-i18n="p4">Sebelumnya</span></span><strong><span data-i18n="{prev["nav"]}">{prev["label"]}</span></strong></a>'
            if prev else '<a class="pn-prev" href="index.html"><span class="pn-label">' + BACK + ' <span data-i18n="p4">Sebelumnya</span></span><strong><span data-i18n="t1">Perusahaan</span></strong></a>')
    if nxt:
        out += f'<a class="pn-next" href="{nxt["file"]}.html"><span class="pn-label"><span data-i18n="p3">Selanjutnya</span> {ARROW}</span><strong><span data-i18n="{nxt["nav"]}">{nxt["label"]}</span></strong><span class="pn-sub"><span data-i18n="{nxt["lead"]}"></span></span></a>'
    else:
        out += f'<a class="pn-next" href="index.html"><span class="pn-label"><span data-i18n="p3">Selanjutnya</span> {ARROW}</span><strong><span data-i18n="t1">Perusahaan</span></strong></a>'
    return out + '</nav>\n'


def footer():
    nav = ''.join(f'<a href="{p["file"]}.html"><span data-i18n="{p["nav"]}">{p["label"]}</span></a>' for p in MENU)
    return ('<footer class="site-footer"><div class="wrap footer-top"><div class="footer-brand"><a class="brand" href="index.html"><img src="assets/jgi-logo-transparent.png" width="82" height="64" alt="JGI Coal Mining" loading="lazy"><span>JAYAKHISMA<small>GLOBE INDONESIA</small></span></a><p><span data-i18n="t129">Sumber daya Indonesia.<br>Tanggung jawab bersama.</span></p></div>'
            f'<nav class="footer-col" aria-label="Footer"><h3><span data-i18n="x21">Navigasi</span></h3>{nav}</nav>'
            '<div class="footer-col"><h3><span data-i18n="x22">Kontak</span></h3><a href="mailto:pt.jayakhisma@gmail.com">pt.jayakhisma@gmail.com</a><p>Epicentrum Walk Office Suites<br>Jl. H. R. Rasuna Said, Kuningan<br>Jakarta Selatan 12940</p></div>'
            '<div class="footer-col"><h3><span data-i18n="x23">Dokumen</span></h3><a href="pesan.html"><span data-i18n="x56">Isi Form Online</span> ↗</a><a href="documents/JGI-Form-PO-Batubara.pdf" download><span data-i18n="x62">Form Pemesanan</span> ↗</a><a href="index.html#legalitas"><span data-i18n="x24">Legalitas &amp; perizinan</span></a><a href="investor.html"><span data-i18n="p50">Investor</span></a><a href="privasi.html"><span data-i18n="p53">Kebijakan Privasi</span></a><a class="footer-cta" href="kontak.html"><span data-i18n="t130">Hubungi JGI</span> ↗</a></div></div>'
            '<div class="footer-mark" aria-hidden="true">JGI</div><div class="wrap footer-bottom"><span>© 2026 PT Jayakhisma Globe Indonesia</span><a href="#utama"><span data-i18n="t131">Kembali ke atas</span> ↑</a></div></footer>'
            '<a class="contact-fab" href="kontak.html" hidden><span data-i18n="t5">Hubungi JGI</span></a>'
            '<dialog id="lightbox"><button class="lb-nav lb-prev" type="button" aria-label="Foto sebelumnya" hidden>‹</button><button class="lb-nav lb-next" type="button" aria-label="Foto berikutnya" hidden>›</button><button id="close-dialog" type="button" aria-label="Tutup gambar">×</button><img alt=""><p id="image-caption"></p></dialog>')


def scripts(extra):
    return ''.join(f'<script src="{s}"></script>' for s in COMMON_JS + extra) + '</body></html>\n'


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read().strip()


def explore():
    cards = ''.join(
        f'<a class="explore-card" href="{p["file"]}.html"><span class="ec-media"><img src="{p["img"]}" alt="" loading="lazy"></span>'
        f'<span class="ec-num">{i + 1:02d}</span><strong><span data-i18n="{p["nav"]}">{p["label"]}</span></strong><span class="ec-desc"><span data-i18n="p{33 + i}"></span></span><span class="ec-go">{ARROW}</span></a>'
        for i, p in enumerate([q for q in MENU[1:] if q['file'] != 'kontak']))
    return ('<section class="section explore" id="jelajahi"><div class="wrap"><div class="section-head"><div><div class="eyebrow"><span data-i18n="p30">JELAJAHI JGI</span></div>'
            '<h2><span data-i18n="p31"></span></h2></div><p><span data-i18n="p39"></span></p></div>'
            f'<div class="explore-grid">{cards}</div></div></section>\n')


def cta():
    return ('<section class="section contact home-cta"><div class="wrap home-cta-inner"><div><div class="eyebrow on-dark"><span data-i18n="t108">MARI TERHUBUNG</span></div>'
            '<h2><span data-i18n="t109">Kebutuhan energi Anda.<br>Awal percakapan kita.</span></h2><p><span data-i18n="t110">Diskusikan kebutuhan pasokan batubara, spesifikasi produk, dan peluang kemitraan dengan tim JGI.</span></p></div>'
            f'<div class="home-cta-actions"><a class="button gold" href="kontak.html"><span data-i18n="t10">Hubungi Tim Komersial</span> {ARROW}</a>'
            f'<a class="button order-pdf" href="kontak.html#pesan"><span data-i18n="p38">Pesan Batubara</span> {ARROW}</a>'
            f'<a class="button order-pdf" href="investor.html"><span data-i18n="p50">Investor</span> {ARROW}</a></div></div></section>\n')


def expand(html):
    html = html.replace('{{legal}}', read('_legal.html')).replace('{{timeline}}', read('_timeline.html'))
    return html.replace('ARROWSVG', ARROW)


def write(name, html):
    with open(os.path.join(ROOT, name), 'w', encoding='utf-8') as f:
        f.write(optimize_images(fill(expand(html))))


# home
about = read('_about.html').replace('href="index.html#legalitas"', 'href="#legalitas"')
legal = read('_legal.html')
band = read('_band.html').replace('</ol></div></section>', f'</ol><a class="text-link band-link" href="operasional.html"><span data-i18n="p40">Lihat alur operasi</span> {ARROW}</a></div></section>')
home = (head('', 'PT Jayakhisma Globe Indonesia. Pertambangan batubara thermal di Kutai Timur dengan infrastruktur tambang, hauling, stockpile dan jetty.', 'index')
        + header('index') + '<main id="utama">' + read('_hero.html') + '\n' + read('_metrics.html') + '\n' + about + '\n' + band + '\n' + explore()
        + read('_timeline.html') + '\n' + legal + '\n' + read('_wilayah.html') + '\n' + cta() + '</main>' + footer() + scripts(['wilayah-data.js?v=2', 'wilayah.js?v=7']))
write('index.html', home)

for i, p in enumerate(PAGES):
    body = read(p['file'] + '.html')
    html = (head(p['title'], p['desc'], p['file']) + header(p['file']) + '<main id="utama" class="subpage">' + page_hero(p) + body + '\n'
            + page_next(i) + '</main>' + footer() + scripts(p['js']))
    write(p['file'] + '.html', html)
EXTRAS = [
    dict(file='investor', nav='p50', label='Investor', title='Ringkasan Investor', h1='p51', lead='p52', img='assets/jgi-excavator-stockpile.jpg',
         desc='Ringkasan investor PT Jayakhisma Globe Indonesia: wilayah IUP, kualitas batubara, infrastruktur, perizinan dan rencana pengembangan.', js=[],
         prev=COMPANY, next=PAGES[-1]),
    dict(file='privasi', nav='p53', label='Kebijakan Privasi', title='Kebijakan Privasi', h1='p55', lead='p54', img='assets/jgi-stockpile-area.jpg',
         desc='Kebijakan privasi website PT Jayakhisma Globe Indonesia.', js=[], prev=COMPANY, next=PAGES[-1]),
]


def pair(prev, nxt):
    return ('<nav class="page-next wrap" aria-label="Halaman lain">'
            f'<a class="pn-prev" href="{prev["file"]}.html"><span class="pn-label">{BACK} <span data-i18n="p4">Sebelumnya</span></span><strong><span data-i18n="{prev["nav"]}">{prev["label"]}</span></strong></a>'
            f'<a class="pn-next" href="{nxt["file"]}.html"><span class="pn-label"><span data-i18n="p3">Selanjutnya</span> {ARROW}</span><strong><span data-i18n="{nxt["nav"]}">{nxt["label"]}</span></strong><span class="pn-sub"><span data-i18n="{nxt["lead"]}"></span></span></a></nav>\n')


for p in EXTRAS:
    html = (head(p['title'], p['desc'], p['file']) + header(p['file']) + '<main id="utama" class="subpage">' + page_hero(p) + read(p['file'] + '.html') + '\n'
            + pair(p['prev'], p['next']) + '</main>' + footer() + scripts(p['js']))
    write(p['file'] + '.html', html)

# 404: GitHub Pages serves it for any missing path, so assets resolve from the site root
base = '/' + SITE.split('://', 1)[1].split('/', 1)[1] if SITE.count('/') > 3 else '/'
nf = dict(nav='p53', label='404', img='assets/hero-mining-night.jpg', h1='p150', lead='p151')
html404 = (head('404', 'Halaman tidak ditemukan.', 'index').replace('<head>', f'<head><base href="{base}"><meta name="robots" content="noindex">', 1) + header('')
           + '<main id="utama" class="subpage">' + page_hero(nf).replace('<span data-i18n="p53">Kebijakan Privasi</span>', '404')
           + f'<section class="section nf-section"><div class="wrap nf-actions"><a class="button gold" href="index.html"><span data-i18n="p152"></span> {ARROW}</a><a class="button inv-ghost" href="kontak.html"><span data-i18n="p5">Kontak Kami</span> {ARROW}</a></div></section>'
           + '</main>' + footer() + scripts([]))
write('404.html', html404)

urls = [SITE] + [f'{SITE}{p["file"]}.html' for p in PAGES + EXTRAS] + [f'{SITE}pesan.html']
with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8') as f:
    f.write(f'User-agent: *\nAllow: /\nDisallow: /source/\nDisallow: /tools/\n\nSitemap: {SITE}sitemap.xml\n')
print('built', 2 + len(PAGES) + len(EXTRAS), 'pages')

js = 'window.JGI_COPY=window.JGI_COPY||{};Object.assign(window.JGI_COPY,' + json.dumps({k: {'id': a, 'en': b, 'zh': c} for k, (a, b, c) in P_COPY.items()}, ensure_ascii=False, separators=(',', ':')) + ');\n'
with open(os.path.join(ROOT, 'page-copy.js'), 'w', encoding='utf-8') as f:
    f.write('/* Generated by tools/build_pages.py */\n' + js)
