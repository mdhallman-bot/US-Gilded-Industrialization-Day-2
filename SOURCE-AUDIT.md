# Historical and instructional audit — first HTML build

## Numeric checks

- All 15 GDP benchmark rows compared directly against official Maddison Project Database 2023 GDPpc workbook: GBR and USA, 2011 international dollars. Display rounded; underlying precision retained. US 1865→1920 increase ≈119%. GBR pre-1700 is England; subsequent coverage changes to Britain/UK. Early values are reconstructions. No ancient/world series fabricated.
- Lighting values transcribed from the rendered original Nordhaus Table 1.6 (pp.52–53): 5.37, 3, .220431, .092096, .013538, .001883, .000119 labor hours per 1,000 lumen-hours. Minute/second conversions recalculated. Table1.4 has a slightly different 1800 entry (5.387); this lesson consistently uses Table1.6 (5.37). Costs omit equipment; wage denominators change; 1992 is not relabeled 2000. Log scale explained and exact-time table provided.
- CDC life expectancy 47.3/76.8 and infant mortality ≈100/6.89 verified. Early registration geography and estimate limits shown. No “most adults died at 47” claim.
- NCES illiteracy 1870/1900, age10+, and 1900 race breakdown checked. Enrollment51%/75%, ages5–19,1900/1940. Literacy is not schooling; race is not treated as class.
- EIA1850/1900 totals2.357/9.587 quadrillionBtu divided by Census populations23,191,876/76,212,168 =101.6304/125.7936 millionBtu per person. Rounded102/126. Historical series geographic limits apply; direct mechanical water power is absent from these totals. Do not treat it as all useful energy or household consumption.
- BLS1915 hours55 scheduled manufacturing /49 paid production-worker hours. Different definitions; no invented modern40-hour comparator or leisure estimate.
- Global top10/bottom50 average-income ratio<20/~40 (1820/1910), World Inequality Report2022 Fig2.2. Not percentages; not US. No bottom-group absolute-income conclusion inferred from ratio alone.

## Qualitative checks

- Cotton gin: seed separation vs cotton picking, patent1794 vs development1793; cotton/slavery relationship corroborated with National Archives. Video publisher description verified. Full video transcript has **not** been independently audited; teacher should preview it before class. No unverified productivity multiplier used.
- NPS Pony Express history corroborates telegraph connection1861. Fast transmission distinguished from last-mile delivery.
- ASCE rail landmark corroborates ~week transcontinental trip vs months overland. Route and access caveats shown.
- NPS Vanderbilt household conveniences corroborated; affluent household not described as lacking electricity/plumbing.
- Working and modern lower-income households are explicitly fictional comparison scenarios; precise wages, home utilities, happiness, and universal internet access are not asserted.
- Official US poverty series begins1959; no comparable1900 rate supplied.

## Pedagogy and workflow

- Definition of industrialization is checked before anchors; central inquiry recurs in benefits/distribution/mechanism tasks.
- Three anchors prioritized; eight brief supporting reveals supply twelve total measures (GDP, life expectancy, infant mortality, lighting, literacy, schooling, poverty, energy, travel, information, hours, household infrastructure).
- Trends distinguished from causal mechanisms. Gallery task requires two evidence stations, one outcome, benefit/cost, and partner challenge.
- No wall cards, wall images, or station explanatory text in HTML or exported PDF. Six anonymous station response fields only.
- Dotted term buttons support mouse hover, keyboard focus, and tap. Tier2 terms broadly supported. Vocabulary check has no definition tooltips and no keyed answer exposed in instructions; terms map uniquely to eight definitions.
- Eight vocabulary matches shuffled; first and latest check scores retained. This is retrieval support, not the formative grade.
- Strong interview scaffolds will be in the separate combined Boost Google Doc, not added to this pre-Boost submission.
- HTML work submission is completion; Boost interview/reflection Doc is formative. All pre-Boost responses are exported; Boost excluded.

## Operational limits

Health and token-authenticated empty-state load were verified against the deployed backend before this build. Backend logic was tested with mocked Apps Script services. Browser tests and live save/load results are recorded in the completion report; do not assume deployment/Pages settings are verified until the actual published URL is tested. No actual student responses are used in testing.

### Checks completed for this upload

Headless Chromium passed: ID entry/normalization, save acknowledgment with a mocked backend, reload/resume, keyboard definitions (87 term occurrences), all eight vocabulary matches and score persistence, paste prevention, complete PDF download, narrow-screen horizontal overflow check, and stale-tab conflict preservation. All GDP benchmarks matched the official workbook. The 11-page sample PDF was rendered and visually reviewed; export is about 322KB.

Published GitHub-origin browser loading and saving passed with synthetic work (no student data). Explicit spreadsheet save acknowledgment was received. Local checks also passed for reload/resume, pending-request retries, conflict preservation, vocabulary scoring, and PDF export. GitHub Pages is enabled. Fresh-session retrieval results are recorded after final deployment verification.

The final student flow uses a student-created unique username (two or more letters followed by two or more numbers), with no real name, school student ID, or class-code prompt. The application token is automatically supplied by the static client, as explicitly requested. This remains the migration packet's token/ID access pattern, not student authentication.

A printable emergency.pdf supplies all pre-Boost content, charts, benchmark tables, fifteen writing fields, the vocabulary match, and a glossary in place of hover definitions. Gallery wall evidence and Boost materials remain separate. Exported student PDFs retain completion percentage at the top.


## Survival line charts
Year 1: illustrative best guesses using Langner (1998), PMID 12178163: modeled Roman-era life expectancy about 20 and infant mortality nearly 400/1,000. This contested reconstruction uses Ulpian (died 228 CE), model life tables and inscriptions. Not a measured year-1 statistic, global average, or consensus value. No intermediate century guesses are added. Dashed bridges compare different populations, not an observed series. Modern solid lines connect selected benchmarks, not annual observations. Time axes are proportional.
Life expectancy: 1900 47.3; 1950 68.2; 1960 69.7; 1970 70.8; 1980 73.7; 1990 75.4; 2000 76.8. CDC/NCHS Health United States 2019 Table 4: https://www.cdc.gov/nchs/data/hus/2019/004-508.pdf. Early registration coverage differs from later national coverage.
Infant mortality (under one, per 1,000 live births): 1900 approximately 100; 1950 29.2; 1960 26; 1970 20; 1980 12.6; 1990 9.2; 2000 6.89. https://www.cdc.gov/nchs/data/data_acces_files/hus01cht.pdf plus https://www.cdc.gov/nchs/products/databriefs/db09.htm for endpoints. Do not substitute under-five mortality.
