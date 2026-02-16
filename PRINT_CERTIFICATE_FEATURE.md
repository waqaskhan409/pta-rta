# Print Certificate Feature - Implementation Guide

## Overview

A professional print-certificate feature has been added to the PTA/RTA vehicle permit management system. Users can now generate and print official-looking certificate documents for **active permits** only.

## Features

✅ **Professional Certificate Design**
- Official-looking certificate layout with RTA branding
- Certificate border and header styling
- Color-coded status badges
- Organized information layout

✅ **Comprehensive Permit Information**
- Permit number and code
- Permit type and details
- Vehicle information (number, type, make, model, year, capacity)
- Owner details (name, CNIC, phone, email)
- Authority information
- Validity period with days remaining calculation
- Additional fields (routes, restrictions, description)

✅ **Printer-Friendly Design**
- Professional CSS styling optimized for printing
- 8.5" x 11" letter size format
- Hides UI controls when printing
- Maintains formatting across browsers
- Color-coded status badges (Active: Green, Pending: Orange, Expired: Red)

✅ **Multiple Access Points**
1. **From Permit List:** Quick "Print" button for active permits
2. **From Permit Details Modal:** "Print Certificate" button visible only for active permits

✅ **Status-Based Access**
- Print button only appears for permits with **"active"** status
- Prevents printing for pending, expired, or inactive permits

## User Interface Changes

### 1. Permit List Page (`PermitList.js`)
- Added **Print** button next to each active permit
- Shows in the actions column with a printer icon
- Only visible when permit status is "active"
- Clicking it opens the permit details modal AND automatically displays the print certificate

### 2. Permit Modal (`PermitModal.js`)
- Added **Print Certificate** button in the dialog actions
- Only visible when viewing/editing an active permit
- Not visible in duplicate or create mode
- Clicking opens the print certificate view

### 3. Print Certificate Component (`PrintCertificate.js`)
- Dedicated fullscreen component for displaying the certificate
- Contains:
  - Print button (🖨️) for browser printing
  - Close button (✕) to return to modal
  - Professional certificate layout

## Technical Implementation

### New Files Created

1. **`/frontend/src/components/PrintCertificate.js`**
   - React component that renders the printable certificate
   - Accepts `permit` object with all permit details
   - `onClose` callback to close the certificate view

2. **`/frontend/src/styles/certificate.css`**
   - All styling for the certificate
   - Print-specific CSS with @media print rules
   - Responsive design that works on mobile/tablet
   - Color-coded status badges

### Modified Files

1. **`/frontend/src/components/PermitModal.js`**
   - Added `PrintIcon` import
   - Added `PrintCertificate` component import
   - Added `printCertificateOpen` state
   - Added `showPrintCertificateOnOpen` prop
   - Added print button in DialogActions (only for active permits)
   - Added useEffect to auto-open print when navigating from list

2. **`/frontend/src/pages/PermitList.js`**
   - Added `PrintIcon` import
   - Added `showPrintCertificateOnOpen` state
   - Updated `handleViewPermit()` to accept `isPrint` parameter
   - Added Print button to each permit row (only for active)
   - Passed new prop to PermitModal component

## How to Use

### For Users

**From Permit List:**
1. Open the Permits list
2. Find an active permit
3. Click the **Print** button (printer icon)
4. The permit modal opens with the certificate already displayed
5. Click **🖨️ Print Certificate** to open the browser print dialog
6. Click **Print** in the browser dialog (or save as PDF)

**From Permit Details Modal:**
1. Click **View** on any permit
2. Wait for the modal to load
3. If permit status is "active", you'll see **Print Certificate** button
4. Click it to see the printable certificate
5. Click **🖨️ Print Certificate** to print

**Printing Tips:**
- Use "Print to PDF" to save certificates as PDF files
- Adjust margins to 0.5 inches for best appearance
- Disable header/footer in print settings
- Use landscape orientation for better fit
- Scaling should be set to 100% or "Fit to page"

### For Developers

#### Certificate Component Props
```javascript
<PrintCertificate 
  permit={permitObject}  // Full permit data with nested objects
  onClose={handleClose}  // Callback when user clicks Close
/>
```

#### Required Permit Object Structure
```javascript
{
  id: Number,
  permit_number: String,
  status: String, // Only prints if 'active'
  permit_type: { id: Number, name: String, code?: String },
  vehicle_type: { id: Number, name: String },
  vehicle_number: String,
  vehicle_make: String,
  vehicle_model: String,
  vehicle_year: Number,
  vehicle_capacity: String,
  owner_name: String,
  owner_email: String,
  owner_phone: String,
  owner_cnic: String,
  authority: String,
  valid_from: String, // ISO date
  valid_to: String,   // ISO date
  issued_date: String,
  description?: String,
  approved_routes?: String,
  restrictions?: String
}
```

## Status-Based Access Logic

```javascript
// Print button visibility condition
{permit.status === 'active' && (
  <Button onClick={handlePrint}>Print Certificate</Button>
)}

// In PermitList:
{permit.status === 'active' && (
  <Button onClick={() => handleViewPermit(permit, true)}>Print</Button>
)}
```

## CSS Classes Reference

### Main Classes
- `.print-certificate-container` - Outer wrapper
- `.certificate` - Main certificate box (8.5" x 11")
- `.certificate-wrapper` - Container for centered certificate
- `.certificate-header-section` - Top section with title

### Print Media Query
- Uses `@media print` to hide controls
- Uses `@page` rule for margins and size
- `page-break-inside: avoid` to prevent splitting content

### Status Styling
- `.status-active` - Green background
- `.status-pending` - Orange background
- `.status-expired` - Red background
- `.status-inactive` - Gray background

## Printing Best Practices

### Browser Print Settings
```
- Margins: 0.5"
- Scale: 100% or Fit to Page
- Orientation: Portrait
- Color: On (for colored status badges)
- Background: On (for gradient backgrounds)
```

### PDF Generation
- Modern browsers support "Save as PDF" via native print dialog
- Ctrl+P (Windows) or Cmd+P (Mac) to open print dialog
- Select "Save as PDF" from printer dropdown

## Testing Checklist

✅ Print button appears only for active permits
✅ Print button doesn't appear for pending/expired permits
✅ Clicking print opens modal with certificate visible
✅ Certificate displays all permit information correctly
✅ Date formatting is correct (e.g., "February 14, 2026")
✅ Days remaining calculation is accurate
✅ Status badge shows correct color (green for active)
✅ Print dialog opens when clicking "Print Certificate"
✅ PDF/paper output is formatted correctly
✅ Close button returns to modal
✅ Responsive design works on mobile browsers

## Future Enhancements

- [ ] Add digital signature field
- [ ] Email certificate as PDF
- [ ] Generate QR code for verification
- [ ] Add RTA watermark to background
- [ ] Support custom branding/logos
- [ ] Multi-language support for certificate text
- [ ] Add certificate template selection
- [ ] Archive printed certificates
- [ ] Add certificate ID/serial number

## Troubleshooting

**Print button not showing?**
- Verify permit status is "active" (exact match)
- Check browser console for errors
- Verify permit data is fully loaded

**Certificate looks wrong on print?**
- Check print margins (should be 0.5")
- Verify color printing is enabled
- Try different browser (Chrome has best CSS print support)
- Clear browser cache and refresh

**Missing information on print?**
- Verify all permit fields are populated in backend
- Check that nested objects (permit_type, vehicle_type) loaded correctly
- Open browser DevTools and inspect permit object

## Performance Notes

- PrintCertificate component is lightweight and conditional-render
- No additional API calls required (uses existing permit data)
- PDF generation done entirely by browser (no server-side processing)
- CSS is optimized for minimal print file size

---

**Last Updated:** February 14, 2026
**Status:** ✅ Ready for Production
