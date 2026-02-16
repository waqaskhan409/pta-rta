# Reporting Feature Implementation Summary

## Overview
A comprehensive reporting and analytics feature has been added to the PTA & RTA Permit Management System. This includes permit history tracking, detailed permit reports, permit analytics dashboards, and various statistical summaries.

## Backend Implementation

### New API Endpoints (Added to PermitViewSet in `views.py`)

#### 1. **Permit History & Reporting**
- **`GET /permits/{id}/history/`** - Get complete history of changes for a single permit
  - Returns: permit details + all historical changes
  - Use case: View audit trail for a specific permit

- **`GET /permits/report_history/`** - Get filtered permit history report
  - Query parameters: `permit_id`, `status`, `action`, `days`
  - Returns: Filtered history records with metadata
  - Use case: Historical analysis with multiple filters

#### 2. **Statistical Reports**

- **`GET /permits/report_detailed_stats/`** - Comprehensive statistics report
  - Overall stats: Total, Active, Expired, Cancelled, Pending, Inactive permits
  - Recent activity: Created/Modified in last 30 days, Expiring soon
  - Authority breakdown: PTA vs RTA permit counts
  - Permit type breakdown: Distribution by type
  - Vehicle type breakdown: Distribution by vehicle
  - Use case: Executive dashboard

- **`GET /permits/report_permits_by_type/`** - Permits grouped by type
  - Shows: Total permits per type, status breakdown
  - Use case: Permit type analysis
  - Data: Name, Code, Total, Status counts (Active, Expired, Cancelled, Pending, Inactive)

- **`GET /permits/report_permits_by_vehicle/`** - Permits grouped by vehicle type
  - Shows: Total permits per vehicle type, status breakdown
  - Use case: Vehicle fleet analysis
  - Data: Vehicle type, Total, Status breakdown

- **`GET /permits/report_authority_summary/`** - Authority-wise summary
  - Shows: Permits by authority (PTA/RTA)
  - Status breakdown for each authority
  - Use case: Authority comparison analysis

- **`GET /permits/report_expiring_permits/?days=30`** - Permits expiring soon
  - Query parameter: `days` (default: 30)
  - Returns: List of permits expiring within specified days
  - Ordered by expiry date (nearest first)
  - Use case: Renewal management

- **`GET /permits/report_owner_permits/`** - Owner-specific report
  - Query parameters: `email`, `name`, `phone`
  - Returns: All permits for matching owner
  - Use case: Owner permit tracking

### Backend Features
- ✅ All endpoints require authentication
- ✅ JSON responses with detailed metadata
- ✅ Flexible filtering capabilities
- ✅ Support for historical data analysis
- ✅ Status breakdown for all types
- ✅ Date-based filtering and sorting

## Frontend Implementation

### 1. **Reports Dashboard** (`pages/Reports.js`)
A comprehensive analytics and reporting interface with multiple tabs:

#### Tabs:
1. **Dashboard Tab**
   - Summary cards showing:
     - Total Permits
     - Active Permits
     - Expired Permits
     - Expiring Soon (30 days)
   - Visualizations:
     - Pie chart: Permits by Status
     - Bar chart: Authority Breakdown
     - Bar chart: Permit Types Distribution
     - Bar chart: Vehicle Types Distribution

2. **Permit Types Tab**
   - Cards for each permit type showing:
     - Permit type name and code
     - Total count with visual chip
     - Active permits with progress bar
     - Status breakdown: Expired, Cancelled, Pending, Inactive
     - Download CSV button

3. **Vehicle Types Tab**
   - Cards for each vehicle type showing:
     - Vehicle type name
     - Total count
     - Active permits with progress bar
     - Download CSV button

4. **Authority Summary Tab**
   - Table showing:
     - Authority name
     - Total permits
     - Status breakdown (Active, Inactive, Cancelled, Expired, Pending)
     - Download CSV button

5. **Expiring Permits Tab**
   - Alert showing count of permits expiring in 30 days
   - Table with columns:
     - Permit Number
     - Vehicle Number
     - Owner Name
     - Permit Type
     - Valid To Date
     - Days Left (color-coded chips)
   - Download CSV button

#### Features:
- 📊 Interactive charts using Recharts
- 📥 CSV export for all reports
- 🎨 Color-coded status chips
- 📈 Progress bars for active permits
- 🔄 Lazy loading - data fetched on tab switch
- 📱 Responsive design

### 2. **Permit Details Report** (`pages/PermitDetails.js`)
A detailed single-permit report page with 6 tabs:

#### Tabs:
1. **Basic Information**
   - Permit number, Authority, Type, Status
   - Issue date, Validity dates, Last modified

2. **Vehicle Details**
   - Vehicle number, type, make, model, year, capacity

3. **Owner Information**
   - Name, CNIC, Email, Phone, Address

4. **Additional Details**
   - Description, Remarks
   - Approved Routes
   - Restrictions

5. **History Tab**
   - Table showing all permit changes:
     - Action (Created, Updated, Activated, etc.)
     - Performed by (User name)
     - Date & Time
     - Notes
     - View Changes button (shows detailed field-level changes)

6. **Documents Tab**
   - Table of attached documents:
     - Document Type
     - Filename
     - Uploaded by
     - Upload date
     - Verification status

#### Features:
- 🖨️ Print functionality
- 📥 CSV export of permit data
- 🔍 Detailed change history with before/after values
- 📄 Document management view
- ⏱️ Expiry countdown (color-coded)
- 🏷️ Status chips and badges
- Navigation back to permit list

### 3. **Integration with Permit List**
- Added "Details" button in PermitList table
- Navigates to `/permit-details/{permitId}`
- Kept existing "View" and "Edit" buttons for modal workflow

### 4. **Navigation**
- Added "Reports" menu item in main navigation
- Available to all authenticated users
- Icon: Assessment icon
- Position: After "New Permit" in main menu

## Features Summary

### Data Export
- ✅ CSV export for all reports
- ✅ One-click download
- ✅ Proper formatting for spreadsheet compatibility

### Analytics & Visualization
- ✅ Pie charts for status distribution
- ✅ Bar charts for type/authority analysis
- ✅ Progress bars for active permit ratios
- ✅ Color-coded status indicators
- ✅ Count badges for history

### History Tracking
- ✅ Complete audit trail per permit
- ✅ User who made changes
- ✅ Timestamp for each change
- ✅ Detailed before/after values
- ✅ Action notes/descriptions

### Filtering & Search
- ✅ By permit ID
- ✅ By status
- ✅ By action type
- ✅ By date range (days)
- ✅ By owner (email, name, phone)
- ✅ By authority

### Reporting Capabilities
- ✅ Executive dashboard with KPIs
- ✅ Permit type analysis
- ✅ Vehicle type analysis
- ✅ Authority comparison
- ✅ Expiring permits warning
- ✅ Owner permit tracking
- ✅ Detailed statistics

## File Changes

### Backend
- **`config/permits/views.py`** (Added ~300 lines)
  - 7 new @action endpoints for reporting
  - Comprehensive statistics gathering
  - Flexible filtering logic
  - JSON response formatting

### Frontend
- **`frontend/src/pages/Reports.js`** (New - 612 lines)
  - Main reporting dashboard
  - 5 reporting tabs
  - Chart visualizations
  - CSV export functionality

- **`frontend/src/pages/PermitDetails.js`** (New - 689 lines)
  - Single permit detailed report
  - 6-tab interface
  - History with change details
  - Print & export functionality

- **`frontend/src/pages/PermitList.js`** (Updated)
  - Added useNavigate hook
  - Added "Details" button linking to PermitDetails page
  - Import for DescriptionIcon

- **`frontend/src/App.js`** (Updated)
  - Added ReportIcon and DetailsIcon imports
  - Added Reports and PermitDetails imports
  - Added "Reports" navigation item
  - Added two new routes:
    - `/reports` → Reports page
    - `/permit-details/:permitId` → PermitDetails page

## Usage

### Accessing Reports
1. Navigate to "Reports" in the main menu
2. View Dashboard with key metrics
3. Switch tabs to view specific reports
4. Click "Download Report" to export as CSV

### Viewing Permit Details
1. In Permit List, click "Details" button
2. View complete permit information across 6 tabs
3. Check History tab for audit trail
4. View Documents tab for attachments
5. Print or export the report

### Report Types
1. **Dashboard** - Executive overview with charts
2. **Permit Types** - Analysis by permit classification
3. **Vehicle Types** - Analysis by vehicle classification
4. **Authority Summary** - PTA vs RTA comparison
5. **Expiring Permits** - Renewal management
6. **Permit History** - Detailed audit trail
7. **Owner Reports** - Individual owner permits
8. **Statistics** - Comprehensive numbers

## API Response Format

All reporting endpoints follow a consistent JSON structure:

```json
{
  "report_type": "Report Name",
  "generated_at": "2026-01-25T10:30:00Z",
  "data": [/* report data */],
  "filters": {/* applied filters */},
  "total_records": 42
}
```

## Permissions
- ✅ Accessible to all authenticated users
- ✅ No special admin permissions required
- ✅ Read-only access to reports
- ✅ Protected by authentication middleware

## Performance Considerations
- ✅ Data loaded on tab switch (lazy loading)
- ✅ Efficient database queries with aggregation
- ✅ Pagination-ready API structure
- ✅ Client-side filtering support
- ✅ Optimized re-renders in React

## Future Enhancements
- PDF export functionality
- Scheduled report generation
- Email report delivery
- Custom report builder
- Graph data export (PNG/SVG)
- Email notifications for expiring permits
- Role-based report access
- Advanced date range filters

## Testing Checklist
- [ ] View Reports Dashboard
- [ ] Check all 5 report tabs load correctly
- [ ] Export each report type as CSV
- [ ] Click on permit "Details" button
- [ ] View all 6 tabs in PermitDetails
- [ ] Check history with detailed changes
- [ ] Print permit details
- [ ] Export permit as CSV
- [ ] Verify charts render correctly
- [ ] Test filters in all reports
- [ ] Test navigation between reports and permits

## Notes
- All endpoints return paginated or aggregated data
- Timestamps are in UTC format
- Status colors: Active=Green, Expired=Red, Pending=Orange, Cancelled=Gray
- Day calculations use server timezone
- CSV exports use UTF-8 encoding
