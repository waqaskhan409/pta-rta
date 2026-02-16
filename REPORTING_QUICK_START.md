# Reporting Feature - Quick Start Guide

## 🎯 What's New?

The system now includes comprehensive reporting and analytics features for permit history, statistics, and detailed permit analysis.

## 📊 Main Features

### 1. Reports Dashboard
Access via: **Main Menu → Reports**

A comprehensive analytics dashboard with 5 tabs:

#### Dashboard Tab
- **Key Metrics Cards**
  - Total Permits
  - Active Permits
  - Expired Permits  
  - Expiring in 30 Days

- **Charts**
  - Pie chart: Status distribution
  - Bar chart: Authority comparison (PTA vs RTA)
  - Bar chart: Permits by Type
  - Bar chart: Permits by Vehicle Type

#### Permit Types Tab
- View all permit types with:
  - Total count
  - Active count with progress bar
  - Status breakdown
  - CSV export button

#### Vehicle Types Tab
- View all vehicle types with:
  - Total count
  - Active count with progress bar
  - CSV export button

#### Authority Summary Tab
- Detailed table showing:
  - PTA and RTA permit counts
  - Status breakdown for each
  - Export as CSV

#### Expiring Permits Tab
- Warning alert showing permits expiring within 30 days
- Sortable table with:
  - Permit number
  - Vehicle number
  - Owner name
  - Expiry date
  - Days remaining (color-coded)

### 2. Permit Details Report
Access via: **Permits List → Click "Details" Button**

A 6-tab detailed report page for each permit:

#### Basic Information
- Permit number and authority
- Type and status
- Issue date and validity period
- Last modified date

#### Vehicle Details
- Vehicle number, type, make, model
- Year and seating capacity

#### Owner Information
- Full name and CNIC
- Email and phone
- Address

#### Additional Details
- Description and remarks
- Approved routes and restrictions

#### History Tab
- Complete audit trail showing:
  - All changes made to the permit
  - Who made the change
  - When it was made
  - Detailed before/after values
  - Notes about the change
- Click "View Changes" to see detailed field-level modifications

#### Documents Tab
- List of all attached documents
- Document type and filename
- Upload date and uploader
- Verification status

### 3. Print & Export
On the Permit Details page:
- **Print Button**: Print the permit details
- **Export Button**: Download as CSV

## 📈 Available Reports

| Report | Purpose | Access |
|--------|---------|--------|
| Dashboard | Executive summary with KPIs | Reports → Dashboard |
| Permit Types | Analysis by permit type | Reports → Permit Types |
| Vehicle Types | Analysis by vehicle type | Reports → Vehicle Types |
| Authority Summary | PTA vs RTA comparison | Reports → Authority Summary |
| Expiring Permits | Renewal management | Reports → Expiring Permits |
| Permit Details | Individual permit report | Permit List → Details Button |
| History | Audit trail with changes | Permit Details → History Tab |

## 🔍 Filters & Search

Most reports support filtering:
- **Status Filter**: Active, Expired, Cancelled, Pending, Inactive
- **Date Filter**: Last 30, 60, 90 days
- **Owner Filter**: By email, name, or phone
- **Authority Filter**: PTA or RTA
- **Type Filter**: By permit type or vehicle type

## 💾 Data Export

All reports include CSV export:
1. View the report
2. Click **"Download Report"** button
3. File saves to your downloads folder
4. Open in Excel or Google Sheets

## 📍 Common Use Cases

### Case 1: Check Expiring Permits
1. Go to **Reports**
2. Click **Expiring Permits** tab
3. See all permits expiring in next 30 days
4. Download CSV for follow-up

### Case 2: Audit Single Permit
1. Go to **Permits List**
2. Click **Details** button
3. View all information across 6 tabs
4. Go to **History** tab to see all changes
5. Click **View Changes** to see before/after values

### Case 3: Analyze Permit Distribution
1. Go to **Reports**
2. Check **Dashboard** tab for charts
3. View **Permit Types** tab for detailed breakdown
4. Download CSV for further analysis

### Case 4: Authority Comparison
1. Go to **Reports**
2. Click **Authority Summary** tab
3. Compare PTA vs RTA statistics
4. Export as CSV

### Case 5: Vehicle Fleet Analysis
1. Go to **Reports**
2. Click **Vehicle Types** tab
3. See distribution of vehicles by type
4. Check active permits per vehicle type

## 🎨 Color Coding

Status indicators use consistent colors:
- 🟢 **Green**: Active permits
- 🔴 **Red**: Expired permits
- 🟠 **Orange**: Pending permits
- ⚫ **Gray**: Cancelled/Inactive permits

## ⚙️ Technical Details

### API Endpoints (Backend)
Reports use these API endpoints:
- `GET /api/permits/report_detailed_stats/`
- `GET /api/permits/report_permits_by_type/`
- `GET /api/permits/report_permits_by_vehicle/`
- `GET /api/permits/report_authority_summary/`
- `GET /api/permits/report_expiring_permits/`
- `GET /api/permits/{id}/history/`

### Response Format
All reports return JSON with:
```json
{
  "report_type": "Report Name",
  "generated_at": "2026-01-25T10:30:00Z",
  "data": [/* report data */],
  "total_records": 42
}
```

## 🔐 Permissions

- ✅ All authenticated users can access reports
- ✅ No special admin permissions required
- ✅ Read-only access (no modifications)
- ✅ Protected by authentication

## 📝 Notes

- All timestamps are in server timezone (UTC)
- "Expiring" calculation: Today + 30 days
- History shows all changes since permit creation
- CSV files are UTF-8 encoded
- Charts update in real-time with current data

## 🆘 Troubleshooting

**Q: Reports not loading?**
- Ensure you're logged in
- Check browser console for errors
- Try refreshing the page

**Q: CSV export empty?**
- Check if there's data for that report type
- Some filters might result in zero records

**Q: History not showing changes?**
- History only shows changes after feature implementation
- Older permits might have limited history

**Q: Print looks wrong?**
- Try using "Print to PDF" instead
- Adjust print margins in browser settings

## 🚀 Tips & Tricks

1. **Quick Expiry Check**: Use Reports → Expiring Permits
2. **Audit Trail**: Use Permit Details → History tab
3. **Bulk Analysis**: Download CSV and open in Excel
4. **Dashboard Refresh**: Refresh page to get latest stats
5. **Print Archive**: Print permits to PDF for records

## 📞 Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review backend API errors in browser console
3. Contact system administrator

---

**Last Updated**: January 25, 2026
