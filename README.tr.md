[English](./README.md) | [Türkçe](./README.tr.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

> Bu belge İngilizce README'nin çevirisidir. Bazı ifadeler birebir olmayabilir.

<p align="center">
  <img src="./docs/logo.jpg" alt="omm logo" width="80"/>
</p>

<h1 align="center">Oh-my-mermaid</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-mermaid"><img src="https://img.shields.io/npm/v/oh-my-mermaid" alt="npm version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  Yapay zeka kodu saniyeler içinde yazar. İnsanların anlaması saatler sürer.<br/>
  Anlamayı atlarsanız kod tabanı bir kara kutuya dönüşür — hatta sizin için bile.<br/><br/>
  <strong>omm bu boşluğu kapatır — insanlar için, yapay zeka tarafından üretilen mimari dokümantasyon.</strong>
</p>

---

## Hızlı Başlangıç

Bunu terminale yapıştırın:

```bash
npm install -g oh-my-mermaid && omm setup
```

Ardından AI kodlama aracınızı açın ve `/omm-scan` yeteneğini çalıştırın:

```
/omm-scan
```

Hepsi bu. Sonucu görüntüleyin:

```bash
omm view
```

## Örnek

> omm kendi kendini taradı. İşte bulduğu şey.

<table><tr>
<td width="50%"><img src="./docs/screenshot.png" alt="omm viewer"/></td>
<td width="50%"><img src="./docs/demo.gif" alt="omm scan demo"/></td>
</tr></table>

## Nasıl Çalışır

Yapay zeka kod tabanını analiz eder ve **perspectives** üretir — mimariye farklı açılardan bakan katmanlar (yapı, veri akışı, entegrasyonlar...). Her perspective bir Mermaid diyagramı ve dokümantasyon alanları içerir.

Her düğüm **özyinelemeli olarak analiz edilir**. Karmaşık düğümler, kendi diyagramlarına sahip iç içe çocuk elementlere dönüşür. Basit olanlar yaprak olarak kalır. Dosya sistemi bu ağacı doğrudan yansıtır:

```
.omm/
├── overall-architecture/           ← perspective
│   ├── description.md
│   ├── diagram.mmd
│   ├── context.md
│   ├── main-process/               ← iç içe element
│   │   ├── description.md
│   │   ├── diagram.mmd
│   │   └── auth-service/           ← daha derin iç içelik
│   │       └── ...
│   └── renderer/
│       └── ...
├── data-flow/
└── external-integrations/
```

Görüntüleyici iç içe yapıyı dosya sisteminden otomatik algılar — alt öğesi olan elementler genişletilebilir grup olarak, diğerleri ise düğüm olarak gösterilir.

Her element en fazla 7 alan taşır: `description`, `diagram`, `context`, `constraint`, `concern`, `todo`, `note`.

## CLI

```bash
omm setup                          # Yetenekleri AI araçlarınıza kaydet
omm view                           # Etkileşimli görüntüleyiciyi aç
omm config language ko             # İçerik dilini ayarla
omm update                         # En son sürüme güncelle
```

Tam komut listesi için `omm help` çalıştırın.

## Yetenekler

Yetenekler, **AI kodlama aracınızın içinde** çalıştırdığınız komutlardır (terminalde değil). `/` ile başlarlar.

| Yetenek | Ne yapar |
| --- | --- |
| `/omm-scan` | Kod tabanını analiz eder → mimari doküman üretir |
| `/omm-push` | Giriş + bağlama + buluta gönderme işlemini tek adımda yapar |

## Bulut

Mimarinizi [ohmymermaid.com](https://ohmymermaid.com) üzerinden bulutta saklayabilirsiniz.

```bash
omm login && omm link && omm push
```

Varsayılan olarak özeldir. Ekibinizle paylaşabilir veya [bu örnekteki](https://ohmymermaid.com/share/c47e20a7063c231760361ed9cb9ec4b6) gibi herkese açık hale getirebilirsiniz.

## Desteklenen AI Araçları

| Platform | Kurulum |
| --- | --- |
| Claude Code | `omm setup claude` |
| Codex | `omm setup codex` |
| Cursor | `omm setup cursor` |
| OpenClaw | `omm setup openclaw` |
| Antigravity | `omm setup antigravity` |

`omm setup` komutu, kurulu tüm araçları otomatik algılar ve yapılandırır.

## Yol Haritası

Bkz. [docs/ROADMAP.md](./docs/ROADMAP.md).

## Geliştirme & Katkı

```bash
git clone https://github.com/oh-my-mermaid/oh-my-mermaid.git
cd oh-my-mermaid
npm install && npm run build
npm test
```

Issue ve PR'lar memnuniyetle karşılanır. [Conventional Commits](https://www.conventionalcommits.org/) kullanın.

## Lisans

[MIT](./LICENSE)
