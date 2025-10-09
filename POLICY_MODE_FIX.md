# Policy Dashboard Loading Issue - Fix Documentation

## Problem
The Policy dashboard is not loading. This is likely due to the data file path not working correctly with the GitHub Pages base path configuration.

## Root Cause
When we configured `base: '/formal-inclusion-simulation/'` in `vite.config.js` for GitHub Pages deployment, the hardcoded path `/population_data.json` no longer resolves correctly.

## Solution Applied
Changed the data loading path in `src/App.jsx` to use Vite's `import.meta.env.BASE_URL`:

```javascript
// Before (broken):
xhr.open('GET', '/population_data.json', true);

// After (fixed):
const dataPath = import.meta.env.BASE_URL + 'population_data.json';
xhr.open('GET', dataPath, true);
```

This ensures the path works in both:
- **Development**: `http://localhost:3000/population_data.json`
- **Production (GitHub Pages)**: `https://octave-engineering.github.io/formal-inclusion-simulation/population_data.json`

## Testing Steps

### Local Testing:
1. Start dev server: `npm run dev`
2. Navigate to Policy mode
3. Verify:
   - Loading progress bar appears
   - Data loads successfully
   - Dashboard renders with baseline statistics
   - Policy sliders are functional

### Production Testing (after deployment):
1. Visit: `https://octave-engineering.github.io/formal-inclusion-simulation/`
2. Click "Policy" tab
3. Verify same functionality as local

## Additional Checks

If the issue persists, check:

1. **Browser Console** - Look for:
   - 404 errors for `population_data.json`
   - CORS errors
   - JSON parsing errors
   - JavaScript errors in PolicyMode component

2. **Network Tab** - Verify:
   - Request to `population_data.json` is made
   - Response status is 200
   - Response size is ~12 MB
   - Content-Type is `application/json`

3. **File Existence** - Confirm:
   - `dashboard/public/population_data.json` exists
   - File is not corrupted (valid JSON)
   - File is not gitignored

## Common Issues & Solutions

### Issue: 404 Not Found
**Solution**: Ensure `population_data.json` is in `dashboard/public/` directory

### Issue: CORS Error
**Solution**: This shouldn't happen with same-origin requests, but if it does, check server configuration

### Issue: JSON Parse Error
**Solution**: Validate the JSON file:
```bash
cd dashboard/public
python -c "import json; json.load(open('population_data.json'))"
```

### Issue: Memory Error (Large File)
**Solution**: The 12 MB file might cause issues on low-memory devices. Consider:
- Creating a smaller sample file for testing
- Implementing pagination/streaming
- Using a backend API instead of static JSON

## Performance Notes

The 12 MB file takes time to load:
- **Local network**: ~1-2 seconds
- **ngrok tunnel**: ~8-15 seconds
- **GitHub Pages**: ~3-5 seconds (with gzip compression)

The progress bar provides user feedback during loading.

## Next Steps

1. Commit the fix:
```bash
git add src/App.jsx
git commit -m "Fix Policy mode data loading path for GitHub Pages"
git push origin main
```

2. Wait for GitHub Actions to deploy (~2-3 minutes)

3. Test on GitHub Pages URL

4. If issues persist, check browser console and report specific errors
