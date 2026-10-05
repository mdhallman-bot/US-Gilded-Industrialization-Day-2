# Unit 2 Day 2: Industrial Transformation

Student lesson for a 100-minute U.S. History block. This build covers the pre-Boost student HTML (minutes 0–68), saving/resuming, and PDF export. The remainder of the day uses the separate Boost source packet and interview/reflection Google Doc. Gallery wall cards, Boost packet/Doc/rubric, teacher slides, and two-part lesson plan are separate deliverables still to build.

## Open the lesson

In this repository, go to **Settings → Pages**. Choose **Deploy from a branch**, **main**, and **/(root)**, then Save. The expected classroom URL is:

https://mdhallman-bot.github.io/US-Gilded-Industrialization-Day-2/

The GitHub connector does not expose a Pages settings write operation. Publication must be enabled in Settings if it is not already enabled. No build step is required. All code and the PDF library are served from this repository.

## Student workflow

1. Open the teacher launch link (which supplies the class code) and enter the teacher-assigned pseudonymous ID, for example AB1234. No names.
2. Complete the opening, charts, and comparisons. Hover, focus, or tap dotted terms for definitions.
3. Visit all six gallery stations; evidence is on separate wall cards. HTML contains only directions and response fields.
4. Complete and check eight vocabulary matches.
5. Save now; wait for “Saved to spreadsheet.” Download and inspect the PDF, then submit it to Classroom.
6. Move into the separate Boost interview and formative reflection Google Doc.

PDF export includes lesson text, the current chart views, full benchmark tables, every response, vocabulary selections/scores, source links, and completion at the top. Gallery evidence and Boost activity content are excluded. Empty fields are explicitly marked. A recovery JSON is available if connectivity fails.

## Backend

The provided Apps Script endpoint is connected in `lesson-data.js`; its token is NOT committed. The teacher launch URL adds `#code=YOUR_SHARED_SECRET` to the classroom URL. The fragment stays out of GitHub/server requests, is read into sessionStorage, and removed from the address bar. A class-code input is available when opening the plain URL. Treat the classroom launch link as access-bearing; distribute it through your classroom assignment. `Code.gs` is the same backend supplied earlier. Spreadsheet ID stays in Apps Script's `SHEET_ID` property; it is not in the student app. Backend setup directions are at the top of `Code.gs`.

- Timestamped append-only history in Saves; Errors contains error codes, never responses or tokens.
- IDs trimmed and uppercased, two or more letters followed by two or more digits.
- Typing queues autosave after 1.8 seconds of inactivity. Manual saving and tab visibility changes also request a save.
- Local device recovery precedes network requests; an acknowledged JSON response is required for cloud save status.
- One request at a time; uncertain requests retry with the same request ID to avoid duplicates.
- Optimistic revisions stop older tabs overwriting newer work. Preserve local work before loading another version.
- Plain-text POST body avoids a CORS preflight. Live GitHub-origin browser saving still needs verification once Pages is enabled.

This follows the migration packet's application-token/ID design. The class code is accessible to students using the app and **is not student authentication**. Someone with a known ID can access that ID's responses. Keep the spreadsheet private and use assigned pseudonymous IDs. No Google OAuth credentials or real student data are in the repo.

## Verification

See `SOURCE-AUDIT.md` for historical boundaries and remaining verification limits. No original source wording has been simplified; the student explanations here are authored instructional prose. Every correct vocabulary definition is reviewed for a unique match. Completion measures fields filled, not reasoning quality; the separate Boost reflection is the formative assessment.

Local development: `python -m http.server 8765` from this directory. No npm install required.

## Dependency

`vendor/jspdf.umd.min.js` is jsPDF 2.5.1, MIT licensed. Its bundled copyright/license notice is retained. Upstream: https://github.com/parallax/jsPDF/tree/v2.5.1
