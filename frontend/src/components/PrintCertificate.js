import React, { useState, useRef, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  ButtonGroup
} from '@mui/material';
import {
  Print as PrintIcon,
  QrCode as QrCodeIcon,
  MoreHoriz as RfidIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import '../styles/certificate.css';

const PrintCertificate = ({ permit, onClose }) => {
  const [printMode, setPrintMode] = useState('certificate');
  const qrCodeRef = useRef();

  // Generate RFID code (unique identifier) - memoized to ensure stability
  const rfidCode = useMemo(() => {
    if (!permit) return '';
    const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `RTA-${permit.id}-${permit.permit_type?.code || 'XX'}-${randomSuffix}`;
  }, [permit?.id, permit?.permit_type?.code]);

  if (!permit) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const calculateDaysRemaining = () => {
    const today = new Date();
    const validTo = new Date(permit.valid_to);
    const timeDiff = validTo - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Generate QR code data (encode permit information)
  const qrCodeData = `PERMIT|${permit.permit_number}|${permit.vehicle_number}|${permit.owner_name}|${permit.valid_to}`;

  // Download QR Code
  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `QR-Permit-${permit.permit_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Download RFID Code as Text/Image
  const downloadRFIDCode = () => {
    const text = `RFID CODE: ${rfidCode}\nPermit ID: ${permit.id}\nPermit Number: ${permit.permit_number}\nGenerated: ${formatDate(new Date().toString())}`;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', `RFID-Code-${permit.permit_number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isActive = permit.status === 'active';

  return (
    <div className="print-certificate-container">
      {/* Print Header with Options */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        p: 2,
        bgcolor: '#f5f5f5',
        borderRadius: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        className: 'no-print'
      }} className="no-print">
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            📋 Print Options:
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setPrintMode('certificate')}
              variant={printMode === 'certificate' ? 'contained' : 'outlined'}
              sx={{
                backgroundColor: printMode === 'certificate' ? '#1976d2' : 'white',
                color: printMode === 'certificate' ? 'white' : 'inherit'
              }}
            >
              Certificate Only
            </Button>
            <Button
              onClick={() => setPrintMode('qr')}
              variant={printMode === 'qr' ? 'contained' : 'outlined'}
              startIcon={<QrCodeIcon />}
              sx={{
                backgroundColor: printMode === 'qr' ? '#1976d2' : 'white',
                color: printMode === 'qr' ? 'white' : 'inherit'
              }}
            >
              + QR Code
            </Button>
            <Button
              onClick={() => setPrintMode('rfid')}
              variant={printMode === 'rfid' ? 'contained' : 'outlined'}
              startIcon={<RfidIcon />}
              sx={{
                backgroundColor: printMode === 'rfid' ? '#1976d2' : 'white',
                color: printMode === 'rfid' ? 'white' : 'inherit'
              }}
            >
              + RFID
            </Button>
            <Button
              onClick={() => setPrintMode('all')}
              variant={printMode === 'all' ? 'contained' : 'outlined'}
              sx={{
                backgroundColor: printMode === 'all' ? '#1976d2' : 'white',
                color: printMode === 'all' ? 'white' : 'inherit'
              }}
            >
              All
            </Button>
          </ButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => window.print()}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            🖨️ Print
          </Button>
          <Button
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            color="error"
          >
            Close
          </Button>
        </Box>
      </Box>

      {/* Certificate Content */}
      <div className="certificate-wrapper">
        {/* Main Certificate Border */}
        <div className="certificate">
          {/* Header Section */}
          <div className="certificate-header-section">
            <div className="certificate-emblem">🏛️</div>
            <div className="certificate-title">
              <h1>TRANSPORT PERMIT CERTIFICATE</h1>
              <p>Regional Transport Authority (RTA)</p>
            </div>
            <div className="certificate-code">
              <strong>Permit #{permit.permit_number}</strong>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`status-badge status-${permit.status}`}>
            {permit.status.toUpperCase()}
          </div>

          {/* Certificate Body */}
          <div className="certificate-body">
            <p className="certificate-intro">
              This is to certify that <strong>{permit.owner_name}</strong> has been issued a valid transport permit as per the regulations of the Regional Transport Authority.
            </p>

            {/* Permit Details Grid */}
            <div className="details-grid">
              <div className="detail-row">
                <div className="detail-item">
                  <label>Permit Type</label>
                  <div className="detail-value">{permit.permit_type?.name || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>Permit Code</label>
                  <div className="detail-value">{permit.permit_type?.code || 'N/A'}</div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Vehicle Number</label>
                  <div className="detail-value">{permit.vehicle_number}</div>
                </div>
                <div className="detail-item">
                  <label>Vehicle Type</label>
                  <div className="detail-value">{permit.vehicle_type?.name || 'N/A'}</div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Owner Name</label>
                  <div className="detail-value">{permit.owner_name}</div>
                </div>
                <div className="detail-item">
                  <label>Owner CNIC</label>
                  <div className="detail-value">{permit.owner_cnic || 'N/A'}</div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Owner Phone</label>
                  <div className="detail-value">{permit.owner_phone}</div>
                </div>
                <div className="detail-item">
                  <label>Authority</label>
                  <div className="detail-value">{permit.authority}</div>
                </div>
              </div>

              {permit.vehicle_make && (
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Vehicle Make</label>
                    <div className="detail-value">{permit.vehicle_make}</div>
                  </div>
                  <div className="detail-item">
                    <label>Vehicle Model</label>
                    <div className="detail-value">{permit.vehicle_model || 'N/A'}</div>
                  </div>
                </div>
              )}

              {permit.vehicle_year && (
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Vehicle Year</label>
                    <div className="detail-value">{permit.vehicle_year}</div>
                  </div>
                  <div className="detail-item">
                    <label>Vehicle Capacity</label>
                    <div className="detail-value">{permit.vehicle_capacity || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Validity Period */}
            <div className="validity-section">
              <h3>📅 Validity Period</h3>
              <div className="validity-grid">
                <div className="validity-item">
                  <label>Valid From</label>
                  <div className="validity-date">{formatDate(permit.valid_from)}</div>
                </div>
                <div className="validity-item">
                  <label>Valid To</label>
                  <div className="validity-date">{formatDate(permit.valid_to)}</div>
                </div>
                <div className="validity-item">
                  <label>Days Remaining</label>
                  <div className="validity-date">{calculateDaysRemaining()} days</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {permit.description && (
              <div className="info-section">
                <h3>📝 Description</h3>
                <p>{permit.description}</p>
              </div>
            )}

            {permit.approved_routes && (
              <div className="info-section">
                <h3>🛣️ Approved Routes</h3>
                <p>{permit.approved_routes}</p>
              </div>
            )}

            {permit.restrictions && (
              <div className="info-section">
                <h3>⚠️ Restrictions</h3>
                <p>{permit.restrictions}</p>
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="certificate-footer">
            <div className="footer-left">
              <p>Issued Date: <strong>{formatDate(permit.issued_date)}</strong></p>
            </div>
            <div className="footer-right">
              <p>Certificate ID: <strong>{permit.id}</strong></p>
            </div>
          </div>

          {/* Seal & Signature Area */}
          <div className="signature-section">
            <div className="seal">🔓</div>
            <div className="sig-line">
              <p>Authorized By</p>
              <div className="sig-box">Regional Transport Authority</div>
            </div>
          </div>

          {/* QR Code Section - Visible when printMode includes QR */}
          {(printMode === 'qr' || printMode === 'all') && (
            <div className="qr-section">
              <h3>📱 QR Code - Quick Verification</h3>
              <div className="qr-code-container" ref={qrCodeRef}>
                <QRCodeCanvas
                  value={qrCodeData}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#1976d2"
                  bgColor="#ffffff"
                />
                <div className="permit-number">Permit: {permit.permit_number}</div>
              </div>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }} className="no-print">
                <Button
                  startIcon={<DownloadIcon />}
                  size="small"
                  variant="outlined"
                  onClick={downloadQRCode}
                  sx={{ fontSize: '11px' }}
                >
                  Download QR
                </Button>
              </Box>
              <p>Scan to verify permit details and owner information</p>
              <p style={{ fontSize: '10px', color: '#42a5f5', marginTop: '10px' }}>
                Encoded Data: {qrCodeData}
              </p>
            </div>
          )}

          {/* RFID Code Section - Visible when printMode includes RFID */}
          {(printMode === 'rfid' || printMode === 'all') && (
            <div className="rfid-section">
              <h3>📡 RFID Code - Unique Identifier</h3>
              <div className="rfid-code-container">
                {/* RFID Code Display */}
                <div className="rfid-code-display">
                  <div className="rfid-code-label">RFID TAG CODE</div>
                  <div className="rfid-code-value">{rfidCode}</div>
                  <div className="rfid-code-barcode">
                    {/* Visual barcode representation */}
                    <div className="barcode-visual">
                      {rfidCode.split('').map((char, idx) => (
                        <div
                          key={idx}
                          className="barcode-line"
                          style={{
                            height: char.charCodeAt(0) % 20 + 15 + 'px',
                            opacity: 0.7 + (idx % 3) * 0.1
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Permit Details */}
                <div className="rfid-details">
                  <div className="rfid-detail-item">
                    <span className="rfid-label">🔑 Permit ID:</span>
                    <span className="rfid-value">{permit.id}</span>
                  </div>
                  <div className="rfid-detail-item">
                    <span className="rfid-label">📄 Permit #:</span>
                    <span className="rfid-value">{permit.permit_number}</span>
                  </div>
                  <div className="rfid-detail-item">
                    <span className="rfid-label">🚗 Vehicle:</span>
                    <span className="rfid-value">{permit.vehicle_number}</span>
                  </div>
                  <div className="rfid-detail-item">
                    <span className="rfid-label">📅 Generated:</span>
                    <span className="rfid-value">{formatDate(new Date().toString())}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }} className="no-print">
                <Button
                  startIcon={<DownloadIcon />}
                  size="small"
                  variant="outlined"
                  onClick={downloadRFIDCode}
                  sx={{ fontSize: '11px' }}
                >
                  Download RFID
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    navigator.clipboard.writeText(rfidCode);
                    alert('RFID code copied to clipboard!');
                  }}
                  sx={{ fontSize: '11px' }}
                >
                  📋 Copy Code
                </Button>
              </Box>

              {/* Description */}
              <p className="rfid-description">Use this code for RFID tag registration and vehicle tracking systems</p>

              {/* Security Warning */}
              <div className="rfid-security-warning">
                <strong>⚠️ Security Notice:</strong> Keep this code secure for authorized tag programming only. Do not share with unauthorized personnel.
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="legal-notice">
            <p>This certificate is valid only during the specified validity period. Unauthorized duplication or alteration is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintCertificate;
