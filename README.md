# StatLab Mobile — MVP

A small, mobile-first PWA prototype for introductory statistical analysis.

## Included
- CSV import and data preview
- Numeric column detection
- Descriptive statistics: valid N, mean, median, mode, sample SD/variance, min/max, quartiles
- Pearson correlation
- Simple linear regression with slope, intercept and R-squared
- Histogram
- CSV download
- PWA manifest and basic service worker

## Important limitations
- This is an MVP, not a full SPSS/R replacement.
- CSV only; Excel/XLSX import is not implemented yet.
- Regression inferential statistics, p-values, confidence intervals, hypothesis tests, ANOVA, multiple/logistic regression and advanced models are not included yet.
- Test and validate numerical results against a trusted statistical package before using them in academic or professional work.
- Files are processed locally in the browser in this prototype. There is no account system, cloud backup, payments, or subscription enforcement.

## Run on a computer
1. Install a recent version of Python or Node.js.
2. Extract this ZIP.
3. In the extracted folder, run `python -m http.server 8000`.
4. Open `http://localhost:8000` in a browser.

## Use from an Android phone
For PWA installation, the site must be served over HTTPS (or localhost for local testing).
1. Upload these files to a static host that supports HTTPS, such as GitHub Pages or Netlify.
2. Open the HTTPS URL in Chrome on Android.
3. Open the browser menu and choose "Install app" or "Add to Home screen" (wording varies).
4. Tap "Load sample data" or import a CSV file.

## Next recommended steps
1. Add a proper CSV parser and Excel import.
2. Add unit tests and compare results against R/Python.
3. Add t-test, chi-square, ANOVA and confidence intervals using a tested statistical library.
4. Add secure backend, accounts, project storage and payment provider before launching paid features.
5. Add privacy policy, terms, accessibility, file-size limits and error logging.
