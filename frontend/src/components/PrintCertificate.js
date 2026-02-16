import React from 'react';
import '../styles/certificate.css';

const PrintCertificate = ({ permit, onClose }) => {
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

  const isActive = permit.status === 'active';

  return (
    <div className="print-certificate-container">
      {/* Print Header */}
      <div className="certificate-header no-print">
        <button onClick={() => window.print()} className="btn-print">
          🖨️ Print Certificate
        </button>
        <button onClick={onClose} className="btn-close-print">
          ✕ Close
        </button>
      </div>

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
