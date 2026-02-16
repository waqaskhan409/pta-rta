# Print Certificate Feature - Quick Start & Troubleshooting

## 🚀 Quick Start (5 Minutes)

### For End Users

**To Print a Certificate:**
1. **From Permits List:**
   - Open Permits page
   - Find a permit with **"ACTIVE"** status (green badge)
   - Click the blue **"Print"** button
   - Certificate preview opens automatically
   - Click **🖨️ Print Certificate** button
   - Choose "Save as PDF" or your printer
   - Click Print

2. **From Permit Details:**
   - Click "View" on any active permit
   - In the modal, look for **"Print Certificate"** button
   - Click it
   - Certificate preview opens
   - Click **🖨️ Print Certificate**
   - Choose destination and print

### For Developers

**To Test the Feature:**
```bash
# 1. Start the development server
cd frontend
npm start

# 2. Navigate to Permits list
# http://localhost:3000/permits

# 3. Click Print on any active permit

# 4. Check browser console for errors
# Press F12 and look for red errors
```

**Key Files to Know:**
- `frontend/src/components/PrintCertificate.js` - Main certificate component
- `frontend/src/styles/certificate.css` - All certificate styling
- `frontend/src/components/PermitModal.js` - Integration point (print button)
- `frontend/src/pages/PermitList.js` - List print button

---

## ❓ FAQ

### Q: Why don't I see the Print button?
**A:** The Print button only shows for active permits. Check:
1. Is permit status "ACTIVE"? (check the status badge - should be green)
2. Are you looking at an active permit? (not pending/expired)
3. Try refreshing the page (F5 or Cmd+R)

### Q: The certificate looks wrong when I print it
**A:** Try these print settings:
- Margins: Set to 0.5 inches
- Scale: 100% or "Fit to page"
- Background: Turn ON (for colored elements)
- Orientation: Portrait (or Landscape)
- Check "Background graphics" checkbox

### Q: Can I print non-active permits?
**A:** No, by design. The system only allows printing certificates for active permits. If you need to print an expired/pending permit, contact your administrator to change its status.

### Q: The page freezes when I click Print
**A:** This might happen if:
- Permit data is still loading (wait a few seconds)
- Your browser is low on memory (close other tabs)
- Clear your browser cache and try again

### Q: Can I email the certificate?
**A:** Not from the app yet, but you can:
1. Save as PDF
2. Attach to email
(Future: direct email feature planned)

### Q: Does it work offline?
**A:** No, you need internet to load the permit data. The printing itself can be done to PDF without internet.

### Q: Can I modify the certificate before printing?
**A:** No, the certificate auto-generates from your permit data. If you want to change it, edit the permit and it will update.

---

## 🐛 Troubleshooting Guide

### Problem: Print button not showing in list
**Checklist:**
```
☐ Permit status is exactly "active" (case-sensitive)
☐ Page is fully loaded (check loading spinner)
☐ Browser console has no errors (Press F12)
☐ Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
☐ Clear browser cache and reload
```

**Solution:**
```javascript
// Check in browser console:
// 1. Are there JS errors?
// Look at Console tab

// 2. Is permit data loaded?
// Open DevTools → Network tab
// Look for /api/permits/ requests
// Should show 200 OK

// 3. Check if component rendered
// Elements tab → search for "Print"
// Should find button element
```

### Problem: Certificate looks blank/wrong
**Checklist:**
```
☐ All fields appear empty - data not loading
☐ Some fields missing - field names don't match
☐ Layout broken - CSS not loading
☐ Text overlapping - font size issue
```

**Solution:**
```javascript
// In browser console, paste:
// Check if permit data exists
const permitModal = document.querySelector('[role="dialog"]');
console.log('Modal found:', !!permitModal);

// Check CSS loaded
document.querySelector('link[href*="certificate"]');
// Should return an element, not null
```

### Problem: Print dialog doesn't open
**Checklist:**
```
☐ Pop-up blocker enabled (disable it)
☐ Browser privacy settings (check permissions)
☐ JavaScript disabled (enable it)
☐ Try different browser
```

**Solution:**
```
1. Check browser extensions - disable ad blockers
2. Try incognito/private mode
3. Try different browser (Chrome > Firefox > Safari)
4. Check browser console for errors
```

### Problem: Certificate cuts off on paper
**Checklist:**
```
☐ Margins too large
☐ Scale too high
☐ Orientation wrong
☐ Paper size wrong
```

**Solution:**
```
Print Settings:
- Set page margins to: 0.5" (all sides)
- Scale: 100% (not "Fit to Page")
- Paper size: Letter (8.5" x 11")
- Orientation: Portrait
- Check "Background graphics" for colors
```

### Problem: Colors don't print correctly
**Checklist:**
```
☐ "Print background colors" is OFF
☐ Printer is black & white only
☐ Color cartridge is empty
☐ PDF viewer settings limiting colors
```

**Solution:**
```
For PDF saving:
- Enable "Print backgrounds"
- Save to PDF (not black & white mode)
- Open PDF in Acrobat (not preview)

For physical printing:
- Ensure color printer selected
- Check ink levels
- Try "Best" quality setting
```

### Problem: Console shows errors
**Common Errors:**

**Error:** `Cannot read property 'status' of undefined`
```
Cause: Permit data not loaded yet
Fix: Wait for modal to fully load, try again
Check: Network tab → /api/permits/ request
```

**Error:** `PrintCertificate is not defined`
```
Cause: Component not imported
Fix: Check PermitModal.js line 45
Should have: import PrintCertificate from './PrintCertificate'
```

**Error:** `Cannot find module 'certificate.css'`
```
Cause: CSS file not in correct path
Fix: Verify file exists: src/styles/certificate.css
Check: Path is correct in PermitModal.js
```

---

## 🔧 Developer Debugging

### Enable Verbose Logging
```javascript
// Add to PrintCertificate.js, line 1:
const DEBUG = true;

// Then use:
DEBUG && console.log('Permit data:', permit);
DEBUG && console.log('Days remaining:', calculateDaysRemaining());
```

### Check Props Being Passed
```javascript
// In PermitModal.js, find PrintCertificate component:
DEBUG && console.log('Rendering PrintCertificate with:', {
  permit: formData,
  printCertificateOpen,
  status: formData?.status
});
```

### Verify CSS Loaded
```javascript
// In browser console:
const link = document.createElement('link');
link.href = document.querySelector('link[href*="certificate"]')?.href;
console.log('Certificate CSS:', link.href);

// Or check inline:
const styles = window.getComputedStyle(
  document.querySelector('.certificate')
);
console.log('Certificate width:', styles.width);
```

### Test Without Modal
```javascript
// Create a test file: PrintCertificateTest.js
import React from 'react';
import PrintCertificate from './PrintCertificate';

const mockPermit = {
  id: 1,
  permit_number: 'TEST-001',
  status: 'active',
  permit_type: { id: 1, name: 'Commercial', code: 'COMM' },
  vehicle_type: { id: 1, name: 'Car' },
  vehicle_number: 'ABC-123',
  vehicle_make: 'Toyota',
  owner_name: 'John Doe',
  owner_cnic: '12345-1234567-1',
  owner_phone: '03001234567',
  authority: 'RTA',
  valid_from: '2026-01-01',
  valid_to: '2026-12-31',
  issued_date: '2026-01-01'
};

export const PrintCertificateTest = () => (
  <PrintCertificate 
    permit={mockPermit} 
    onClose={() => console.log('Closed')} 
  />
);
```

---

## 📈 Performance Tips

### Optimize for Large Datasets
```javascript
// In PermitList.js, if fetching many permits:
// Add pagination or lazy loading

// Current: All permits loaded at once
// Improvement: Load 50 at a time, load more on scroll
```

### Reduce Certificate Size
```css
/* In certificate.css, if PDF is too large:
Reduce: font-sizes, padding, margins
Compress: background images, gradients
```

---

## 🔐 Security Notes

### Certificate Data Privacy
- Certificate displays public information only
- Owner email is optional (not shown if empty)
- CNIC shown (as it's on the permit anyway)
- No password or secret data included

### Print Audit Trail
- Current: No logging (could add)
- Future: Log who printed, when, for which permits
- Implement: Add backend logging for compliance

---

## 📱 Mobile Printing Guide

### iOS (iPhone/iPad)
```
1. Open Permits page in Safari
2. Find active permit → Click Print
3. Click Print Certificate button
4. Choose: Printer or Save to Files/Mail
5. If saving: use Mail, Calendar, Notes, or Files app
```

### Android
```
1. Open Permits page in Chrome
2. Find active permit → Click Print
3. Click Print Certificate button
4. Click Print/Share button in dialog
5. Choose: Google Print, Save as PDF, Gmail, etc.
```

---

## 🎓 Best Practices

### For Users
✅ **Do:**
- Print certificates for active permits only
- Use "Save as PDF" for record-keeping
- Name PDFs with permit number for organization
- Keep digital copies backed up

❌ **Don't:**
- Try to print expired/pending permits
- Print directly to network printer if possible (use PDF first)
- Edit printed certificates manually
- Share certificates with unauthorized persons

### For Developers
✅ **Do:**
- Test across browsers before deploying
- Verify print styles don't break layout
- Check mobile printing works
- Monitor console for errors

❌ **Don't:**
- Change CSS without testing print
- Add dynamic content that changes on print
- Use external resources (images, fonts)
- Forget about print media queries

---

## 📞 Support Contacts

**For Technical Issues:**
- Check DevTools (F12) → Console tab
- Review troubleshooting guide above
- Check documentation files

**For Feature Requests:**
- Document current limitations
- Explain use case
- Submit to development team

**For Bug Reports:**
- Include: Browser, OS, permit status
- Check: Console errors, Network tab
- Provide: Steps to reproduce

---

## 📚 Related Documentation

- [Complete Feature Guide](PRINT_CERTIFICATE_FEATURE.md)
- [Visual Integration Guide](PRINT_CERTIFICATE_VISUAL_GUIDE.md)
- [Implementation Checklist](PRINT_CERTIFICATE_CHECKLIST.md)

---

**Version:** 1.0
**Last Updated:** February 14, 2026
**Status:** ✅ Production Ready

*For latest updates, check the main documentation files.*
