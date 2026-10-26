# Execution summary

Fill the "Actual" column from `playwright-report/` after running `npm test`. "Predicted" is based on manual exploration (docs/exploration-notes.md), so any difference is itself a finding worth investigating.

Run date: ______  Browser: Chromium (Playwright 1.48.2)  Totals: passed __ / failed __ / skipped __ / fixme __

| ID | Predicted | Actual | Notes |
| --- | --- | --- | --- |
| TH-01 | Pass | | |
| TH-02 | Pass | | |
| TH-03 | Pass | | |
| TH-04 | Pass (verified manually) | | |
| TH-05 | Pass | | |
| TH-06 | Fail (soft): new tab redirects to login | | DEF-05; theme part should pass |
| TH-07 [light] | Fail (soft): contrast | | DEF-01, DEF-02, DEF-03 |
| TH-07 [dark] | Fail (soft): sidebar label contrast | | DEF-03 |
| TH-08a | Fail: UI switches without saving; uncaught exception | | DEF-08 |
| TH-08b | Fail: `data-theme-mode` takes the invalid value | | DEF-07 |
| E-01 | Pass (verified manually) | | |
| E-02 | Pass (verified manually) | | |
| E-03 | Pass | | |
| E-04 | Fixme | | Logout control not explored |

Any failure not listed in docs/defect-report.md: add it there with steps, evidence (screenshot or trace from the report) and root-cause analysis.
