<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Evdivine Sitemap</title>
        <style>
          :root {
            --bg: #0b1020;
            --bg2: #111827;
            --panel: rgba(255, 255, 255, 0.08);
            --panel-border: rgba(255, 255, 255, 0.12);
            --text: #f8fafc;
            --muted: rgba(248, 250, 252, 0.74);
            --accent: #f59e0b;
            --accent2: #fb7185;
            --shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
          }

          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            min-height: 100%;
            background:
              radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 26%),
              radial-gradient(circle at top right, rgba(251, 113, 133, 0.16), transparent 28%),
              linear-gradient(180deg, #050816 0%, var(--bg) 45%, var(--bg2) 100%);
            color: var(--text);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          a { color: inherit; text-decoration: none; }

          .page {
            width: min(1180px, calc(100% - 28px));
            margin: 0 auto;
            padding: 28px 0 40px;
          }

          .hero {
            border: 1px solid var(--panel-border);
            border-radius: 28px;
            background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
            box-shadow: var(--shadow);
            padding: 30px;
            position: relative;
            overflow: hidden;
          }

          .hero::after {
            content: "";
            position: absolute;
            width: 320px;
            height: 320px;
            right: -130px;
            bottom: -130px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.22), transparent 70%);
            pointer-events: none;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 12px;
            font-weight: 800;
            color: var(--accent);
          }

          .eyebrow::before {
            content: "";
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.12);
          }

          h1 {
            margin: 14px 0 0;
            font-size: clamp(2rem, 4vw, 4rem);
            line-height: 1.02;
            letter-spacing: -0.04em;
          }

          .subtitle {
            margin: 14px 0 0;
            max-width: 820px;
            color: var(--muted);
            font-size: clamp(0.98rem, 1.8vw, 1.08rem);
            line-height: 1.75;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 24px;
          }

          .stat {
            background: var(--panel);
            border: 1px solid var(--panel-border);
            border-radius: 20px;
            padding: 16px;
            backdrop-filter: blur(14px);
          }

          .stat-value {
            display: block;
            font-size: 30px;
            font-weight: 900;
            line-height: 1;
          }

          .stat-label {
            display: block;
            margin-top: 8px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.5;
          }

          .section {
            margin-top: 26px;
          }

          .section-head {
            display: flex;
            justify-content: space-between;
            align-items: end;
            gap: 14px;
            margin-bottom: 14px;
          }

          .section-head h2 {
            margin: 0;
            font-size: 1.15rem;
            letter-spacing: -0.02em;
          }

          .section-head p {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 0.95rem;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }

          .card {
            min-height: 152px;
            border: 1px solid var(--panel-border);
            border-radius: 22px;
            background: rgba(15, 23, 42, 0.76);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
            padding: 18px;
            backdrop-filter: blur(12px);
            transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          }

          .card:hover {
            transform: translateY(-2px);
            border-color: rgba(245, 158, 11, 0.42);
            background: rgba(17, 24, 39, 0.94);
          }

          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: start;
            gap: 12px;
            margin-bottom: 14px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 7px 10px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: rgba(245, 158, 11, 0.14);
            color: #fcd34d;
            border: 1px solid rgba(245, 158, 11, 0.18);
          }

          .priority {
            font-size: 12px;
            color: var(--muted);
            white-space: nowrap;
          }

          .loc {
            display: block;
            color: #fff;
            font-weight: 700;
            font-size: 0.98rem;
            line-height: 1.55;
            word-break: break-word;
          }

          .meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 14px;
            color: var(--muted);
            font-size: 12px;
          }

          .meta span {
            padding: 7px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
          }

          .footer {
            margin-top: 22px;
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: var(--muted);
            font-size: 12px;
            line-height: 1.7;
          }

          @media (max-width: 960px) {
            .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }

          @media (max-width: 640px) {
            .page {
              width: min(100% - 18px, 100%);
              padding: 18px 0 28px;
            }

            .hero {
              padding: 20px;
              border-radius: 22px;
            }

            .stats,
            .grid {
              grid-template-columns: 1fr;
            }

            .section-head {
              flex-direction: column;
              align-items: start;
            }

            .card {
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <div class="eyebrow">Evdivine Sitemap</div>
            <h1>Clean, responsive sitemap view for every public route.</h1>
            <p class="subtitle">
              The XML stays crawler-friendly, while the stylesheet gives you a polished browser view with
              mobile-first cards, soft shadows, and smooth spacing.
            </p>

            <div class="stats">
              <div class="stat">
                <span class="stat-value"><xsl:value-of select="count(/sitemap:urlset/sitemap:url)"/></span>
                <span class="stat-label">indexed URLs</span>
              </div>
              <div class="stat">
                <span class="stat-value">100%</span>
                <span class="stat-label">responsive layout</span>
              </div>
              <div class="stat">
                <span class="stat-value">1</span>
                <span class="stat-label">canonical sitemap</span>
              </div>
              <div class="stat">
                <span class="stat-value">SEO</span>
                <span class="stat-label">search-engine ready</span>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <h2>Public URLs</h2>
                <p>Sorted by priority, with last modified date and crawl frequency.</p>
              </div>
            </div>

            <div class="grid">
              <xsl:for-each select="/sitemap:urlset/sitemap:url">
                <xsl:sort select="sitemap:priority" data-type="number" order="descending" />
                <article class="card">
                  <div class="card-top">
                    <span class="badge">
                      <xsl:choose>
                        <xsl:when test="position() = 1">Top Priority</xsl:when>
                        <xsl:when test="sitemap:priority &gt;= 0.9">Core</xsl:when>
                        <xsl:when test="contains(sitemap:loc, 'reading') or contains(sitemap:loc, 'consultation')">Service</xsl:when>
                        <xsl:otherwise>Public</xsl:otherwise>
                      </xsl:choose>
                    </span>
                    <span class="priority">Priority <xsl:value-of select="sitemap:priority"/></span>
                  </div>

                  <a class="loc" href="{sitemap:loc}">
                    <xsl:value-of select="sitemap:loc"/>
                  </a>

                  <div class="meta">
                    <span>Last mod: <xsl:value-of select="sitemap:lastmod"/></span>
                    <span>Freq: <xsl:value-of select="sitemap:changefreq"/></span>
                  </div>
                </article>
              </xsl:for-each>
            </div>
          </section>

          <div class="footer">
            If your browser still shows raw XML, open the stylesheet URL directly to confirm it is being served
            correctly. Search engines will ignore the styling and read the XML only.
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
