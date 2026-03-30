[English](./README.md) | [Türkçe](./README.tr.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

> Bu belge İngilizce README'nin Türkçe çevirisidir. Bazı terimler bilinçli olarak İngilizce bırakılmıştır.

<p align="center">
  <img src="./docs/logo.jpg" alt="omm logo" width="80"/>
</p>

<h1 align="center">Oh-my-mermaid</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-mermaid"><img src="https://img.shields.io/npm/v/oh-my-mermaid" alt="npm version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  Yapay zekâ kodu saniyeler içinde yazıyor. İnsanların o kodu anlaması ise saatler sürüyor.<br/>
  O an anlamayı es geçerseniz, kod tabanı kısa sürede bir kara kutuya dönüşüyor — üstelik sizin için bile.<br/><br/>
  <strong>omm bu boşluğu kapatır — insanlar için, yapay zekâ destekli mimari dokümantasyon üretir.</strong>
</p>

---

## Hızlı Başlangıç

Aşağıdaki komutu terminale yapıştırın:

```bash
npm install -g oh-my-mermaid && omm setup
```

Ardından kullandığınız AI kodlama aracını açın ve `/omm-scan` yeteneğini çalıştırın:

```
/omm-scan
```

Hepsi bu kadar. Sonucu görüntülemek için:

```bash
omm view
```

## Örnek

> omm kendi kod tabanını taradı. Ortaya çıkan sonuç şöyle.

<table><tr>
<td width="50%"><img src="./docs/screenshot.png" alt="omm viewer"/></td>
<td width="50%"><img src="./docs/demo.gif" alt="omm scan demo"/></td>
</tr></table>

## Nasıl Çalışır?

Yapay zekâ kod tabanını analiz eder ve **perspective**'ler üretir — yani mimariye farklı açılardan bakan katmanlar (yapı, veri akışı, entegrasyonlar vb.). Her perspective içinde bir Mermaid diyagramı ve ilgili dokümantasyon alanları bulunur.

Her düğüm **özyinelemeli olarak analiz edilir**. Karmaşık düğümler, kendi diyagramlarına sahip iç içe alt elementlere dönüşür. Daha basit olanlar ise yaprak düğüm olarak kalır. Dosya sistemi de bu ağacı doğrudan yansıtır:

```
.omm/
├── overall-architecture/           ← perspective
│   ├── description.md
│   ├── diagram.mmd
│   ├── context.md
│   ├── main-process/               ← iç içe element
│   │   ├── description.md
│   │   ├── diagram.mmd
│   │   └── auth-service/           ← daha derin iç içe yapı
│   │       └── ...
│   └── renderer/
│       └── ...
├── data-flow/
└── external-integrations/
```

Görüntüleyici, bu iç içe yapıyı dosya sistemine bakarak otomatik algılar. Alt öğeleri olan elementler genişletilebilir grup olarak, diğerleri ise düğüm olarak gösterilir.

Her element en fazla 7 alan taşıyabilir: `description`, `diagram`, `context`, `constraint`, `concern`, `todo`, `note`.

## CLI

```bash
omm setup                          # Yetenekleri AI araçlarına kaydet
omm view                           # Etkileşimli görüntüleyiciyi aç
omm config language ko             # İçerik dilini ayarla
omm update                         # En güncel sürüme geç
```

Tüm komutları görmek için `omm help` çalıştırın.

## Yetenekler

Yetenekler, **AI kodlama aracınızın içinde** çalıştırdığınız komutlardır (terminalde değil). `/` ile başlarlar.

| Yetenek | Açıklama |
| --- | --- |
| `/omm-scan` | Kod tabanını analiz eder → mimari dokümantasyon üretir |
| `/omm-push` | Giriş + bağlama + buluta gönderme işlemini tek adımda tamamlar |

## Bulut

Mimarinizi [ohmymermaid.com](https://ohmymermaid.com) üzerinden bulutta saklayabilirsiniz.

```bash
omm login && omm link && omm push
```

Varsayılan olarak özeldir. İsterseniz ekibinizle paylaşabilir ya da [bu örnekte olduğu gibi](https://ohmymermaid.com/share/c47e20a7063c231760361ed9cb9ec4b6) herkese açık hale getirebilirsiniz.

## Desteklenen AI Araçları

| Platform | Kurulum |
| --- | --- |
| Claude Code | `omm setup claude` |
| Codex | `omm setup codex` |
| Cursor | `omm setup cursor` |
| OpenClaw | `omm setup openclaw` |
| Antigravity | `omm setup antigravity` |

`omm setup` komutu, yüklü tüm araçları otomatik olarak algılar ve yapılandırır.

## Yol Haritası

Bkz. [docs/ROADMAP.md](./docs/ROADMAP.md).

## Geliştirme ve Katkı

```bash
git clone https://github.com/oh-my-mermaid/oh-my-mermaid.git
cd oh-my-mermaid
npm install && npm run build
npm test
```

Issue ve PR'lar memnuniyetle karşılanır. Lütfen [Conventional Commits](https://www.conventionalcommits.org/) kullanın.

## Lisans

[MIT](./LICENSE)
