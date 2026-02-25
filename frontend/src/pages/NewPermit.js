import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon,
  CheckCircle as SubmitIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { chalanAPI } from '../services/chalanService';
import '../styles/page.css';

function NewPermit() {
  const { user } = useAuth();

  const steps = [
    'Permit Configuration',
    'Vehicle Details',
    'Owner Information',
    'Additional Info',
    'Create Chalan',
    'Documents Submission',
    'Review & Submit',
  ];

  // Check if user is an employee or admin
  const isEmployeeOrAdmin = user && (
    user?.role?.name === 'admin' ||
    user?.role === 'admin' ||
    user?.is_staff === true ||
    (user?.features && user.features.some(f =>
      (f.name?.toLowerCase() === 'employee' || f.toLowerCase?.() === 'employee')
    ))
  );

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    authority: 'RTA',
    permit_type_id: '',
    vehicle_number: '',
    vehicle_type_id: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_capacity: '',
    owner_name: '',
    owner_cnic: '',
    owner_email: '',
    owner_phone: '',
    owner_address: '',
    description: '',
    remarks: '',
    restrictions: '',
    approved_routes: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });
  const [permitTypes, setPermitTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [createdPermitId, setCreatedPermitId] = useState(null);
  const [createdChalanId, setCreatedChalanId] = useState(null);
  const [renewalPermitId, setRenewalPermitId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  // Chalan form states
  const [chalanData, setChalanData] = useState({
    owner_name: '',
    owner_cnic: '',
    owner_phone: '',
    car_number: '',
    permit: '',
    vehicle_type: '',
    violation_description: '',
    fees_amount: '',
    remarks: '',
  });
  const [autoCalcFee, setAutoCalcFee] = useState(true);
  const [userDrafts, setUserDrafts] = useState([]);
  const [showDraftsDialog, setShowDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Fetch permit types and vehicle types on component mount
  useEffect(() => {
    fetchPermitTypes();
    fetchVehicleTypes();

    // Pre-fill owner information from logged-in user
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        owner_name: user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username || '',
        owner_email: user.email || '',
      }));

      // Also pre-fill chalan owner data
      setChalanData(prevData => ({
        ...prevData,
        owner_name: user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username || '',
      }));
    }

    // Check for renewal permit parameter
    const params = new URLSearchParams(window.location.search);
    const renewalId = params.get('renewalPermitId');
    const validFrom = params.get('validFrom');
    const validTo = params.get('validTo');

    if (renewalId) {
      setRenewalPermitId(renewalId);
      fetchExpiredPermitAndPrefill(renewalId, validFrom, validTo);
    }
  }, [user, renewalPermitId]);

  // Fetch available drafts on component mount
  useEffect(() => {
    if (user && !renewalPermitId) {
      // Only show drafts if not in a renewal flow
      fetchUserDrafts();
    }
  }, [user, renewalPermitId]);

  const fetchPermitTypes = async () => {
    try {
      const response = await apiClient.get('/permit-types/');
      setPermitTypes(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch permit types:', err);
      setPermitTypes([]);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await apiClient.get('/vehicle-types/');
      setVehicleTypes(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch vehicle types:', err);
      setVehicleTypes([]);
    }
  };

  const fetchExpiredPermitAndPrefill = async (expiredPermitId, validFrom, validTo) => {
    try {
      const response = await apiClient.get(`/permits/${expiredPermitId}/`);
      const expiredPermit = response.data;

      // Pre-fill all fields from the expired permit
      const prefillData = {
        authority: expiredPermit.authority || 'RTA',
        permit_type_id: expiredPermit.permit_type_id || '',
        vehicle_number: expiredPermit.vehicle_number || '',
        vehicle_type_id: expiredPermit.vehicle_type_id || '',
        vehicle_make: expiredPermit.vehicle_make || '',
        vehicle_model: expiredPermit.vehicle_model || '',
        vehicle_year: expiredPermit.vehicle_year || new Date().getFullYear(),
        vehicle_capacity: expiredPermit.vehicle_capacity || '',
        owner_name: expiredPermit.owner_name || '',
        owner_cnic: expiredPermit.owner_cnic || '',
        owner_email: expiredPermit.owner_email || '',
        owner_phone: expiredPermit.owner_phone || '',
        owner_address: expiredPermit.owner_address || '',
        description: expiredPermit.description || '',
        remarks: expiredPermit.remarks || '',
        restrictions: expiredPermit.restrictions || '',
        approved_routes: expiredPermit.approved_routes || '',
        valid_from: validFrom || new Date().toISOString().split('T')[0],
        valid_to: validTo || '',
      };

      setFormData(prefillData);

      // Also pre-fill chalan data
      setChalanData({
        owner_name: expiredPermit.owner_name || '',
        owner_cnic: expiredPermit.owner_cnic || '',
        owner_phone: expiredPermit.owner_phone || '',
        car_number: expiredPermit.vehicle_number || '',
        permit: '',
        vehicle_type: expiredPermit.vehicle_type_id || '',
        violation_description: 'Permit Renewal Fee',
        fees_amount: '',
        remarks: `Renewal for permit: ${expiredPermit.permit_number}`,
      });

      // Auto-jump to step 4 (Create Chalan) - 0-indexed
      setActiveStep(4);

      setMessage({
        type: 'success',
        text: `✓ Renewal permit wizard loaded with data from permit ${expiredPermit.permit_number}. Please generate the chalan, add documents, and submit.`,
      });
    } catch (err) {
      console.error('Failed to fetch expired permit:', err);
      setMessage({
        type: 'error',
        text: 'Failed to load renewal permit data. Please try again.',
      });
    }
  };

  const fetchUserDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const response = await apiClient.get('/permits/my_drafts/');
      setUserDrafts(response.data.drafts || []);

      // Show dialog if user has saved drafts
      if (response.data.drafts && response.data.drafts.length > 0) {
        setShowDraftsDialog(true);
      }
    } catch (err) {
      console.error('Failed to fetch user drafts:', err);
      // Don't show error, just silently fail on draft fetch
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleLoadDraft = (draft) => {
    try {
      // Pre-fill form with draft data
      setFormData({
        authority: draft.authority || 'RTA',
        permit_type_id: draft.permit_type_id || '',
        vehicle_number: draft.vehicle_number || '',
        vehicle_type_id: draft.vehicle_type_id || '',
        vehicle_make: draft.vehicle_make || '',
        vehicle_model: draft.vehicle_model || '',
        vehicle_year: draft.vehicle_year || new Date().getFullYear(),
        vehicle_capacity: draft.vehicle_capacity || '',
        owner_name: draft.owner_name || '',
        owner_cnic: draft.owner_cnic || '',
        owner_email: draft.owner_email || '',
        owner_phone: draft.owner_phone || '',
        owner_address: draft.owner_address || '',
        description: draft.description || '',
        remarks: draft.remarks || '',
        restrictions: draft.restrictions || '',
        approved_routes: draft.approved_routes || '',
        valid_from: draft.valid_from || new Date().toISOString().split('T')[0],
        valid_to: draft.valid_to || '',
      });

      setCurrentDraftId(draft.id);
      setShowDraftsDialog(false);
      setMessage({
        type: 'success',
        text: `✓ Draft permit loaded! Continue filling the form.`,
      });
    } catch (err) {
      console.error('Error loading draft:', err);
      setMessage({
        type: 'error',
        text: 'Failed to load draft. Please try again.',
      });
    }
  };

  // Validate current step
  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Permit Configuration
        return formData.permit_type_id !== '';
      case 1: // Vehicle Details
        return (
          formData.vehicle_number !== '' &&
          formData.vehicle_type_id !== '' &&
          formData.vehicle_make !== '' &&
          formData.vehicle_model !== '' &&
          formData.vehicle_year !== '' &&
          formData.vehicle_capacity !== ''
        );
      case 2: // Owner Information
        return (
          formData.owner_name !== '' &&
          formData.owner_cnic !== '' &&
          formData.owner_phone !== '' &&
          formData.owner_address !== ''
        );
      case 3: // Additional Info
        return formData.description !== '';
      case 4: // Documents Submission (optional)
        return true;
      case 5: // Review & Submit
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    } else {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields on this step.',
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format CNIC: 12345-1234567-1
    if (name === 'owner_cnic') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 0) {
        if (cleaned.length <= 5) {
          processedValue = cleaned;
        } else if (cleaned.length <= 12) {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
        } else {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12) + '-' + cleaned.slice(12, 13);
        }
      } else {
        processedValue = '';
      }
    }

    // Format Phone: numeric only
    if (name === 'owner_phone') {
      processedValue = value.replace(/\D/g, '');
    }

    const updatedData = {
      ...formData,
      [name]: processedValue,
    };

    // Auto-calculate valid_to when vehicle type changes
    if (name === 'vehicle_type_id' && value) {
      const selectedVehicle = vehicleTypes.find((v) => v.id === parseInt(value));
      if (selectedVehicle && formData.valid_from) {
        const durationDays = selectedVehicle.permit_duration_days || 365;
        const fromDate = new Date(formData.valid_from);
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + durationDays);
        updatedData.valid_to = toDate.toISOString().split('T')[0];
      }
    }

    setFormData(updatedData);
  };

  const handleChalanInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format CNIC
    if (name === 'owner_cnic') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 0) {
        if (cleaned.length <= 5) {
          processedValue = cleaned;
        } else if (cleaned.length <= 12) {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
        } else {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12) + '-' + cleaned.slice(12, 13);
        }
      } else {
        processedValue = '';
      }
    }

    // Format Phone
    if (name === 'owner_phone') {
      processedValue = value.replace(/\D/g, '');
    }

    setChalanData({
      ...chalanData,
      [name]: processedValue,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const vehicleTypeId = parseInt(formData.vehicle_type_id, 10);
      const permitTypeId = parseInt(formData.permit_type_id, 10);

      if (isNaN(vehicleTypeId) || isNaN(permitTypeId)) {
        setMessage({
          type: 'error',
          text: 'Invalid type selection. Please select again.',
        });
        setLoading(false);
        return;
      }

      const dataToSubmit = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: vehicleTypeId,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        vehicle_capacity: formData.vehicle_capacity,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_cnic: formData.owner_cnic,
        owner_phone: formData.owner_phone,
        owner_address: formData.owner_address,
        authority: formData.authority,
        permit_type: permitTypeId,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        description: formData.description,
        remarks: formData.remarks,
        restrictions: formData.restrictions,
        approved_routes: formData.approved_routes,
      };

      // If this is a renewal, use the reapply_for_expired endpoint
      let response;
      let permitId;

      if (renewalPermitId) {
        console.log(`Reapplying for expired permit: ${renewalPermitId}`);
        response = await apiClient.post(`/permits/${renewalPermitId}/reapply_for_expired/`, {
          valid_from: formData.valid_from,
          valid_to: formData.valid_to,
        });
        permitId = response.data.id;
        console.log(`Renewal permit created: ${permitId}`);
      } else {
        console.log('Creating new permit');
        response = await apiClient.post('/permits/', dataToSubmit);
        permitId = response.data.id;
      }

      // Create chalan if chalan data is provided
      let chalanCreated = false;
      let chalanId = null;

      if (chalanData.owner_name.trim()) {
        try {
          const chalanPayload = {
            owner_name: chalanData.owner_name,
            owner_cnic: chalanData.owner_cnic,
            owner_phone: chalanData.owner_phone,
            car_number: chalanData.car_number,
            permit: permitId,
            vehicle_type: parseInt(chalanData.vehicle_type),
            violation_description: chalanData.violation_description,
            fees_amount: chalanData.fees_amount ? parseFloat(chalanData.fees_amount) : null,
          };

          const chalanResponse = await chalanAPI.createChalan(chalanPayload);
          chalanId = chalanResponse.data.id;
          chalanCreated = true;
          console.log(`Chalan #${chalanId} created for permit #${permitId}`);
        } catch (chalanErr) {
          console.error('Error creating chalan:', chalanErr);
          // Don't fail permit creation if chalan fails
        }
      }

      // Upload documents if any
      let uploadedDocCount = 0;
      let failedDocCount = 0;

      if (pendingDocuments.length > 0) {
        console.log(`Uploading ${pendingDocuments.length} documents for permit ${permitId}`);

        for (const doc of pendingDocuments) {
          const docFormData = new FormData();
          docFormData.append('file', doc.file);
          docFormData.append('permit', permitId);
          docFormData.append('document_type', 'other');
          docFormData.append('filename', doc.filename);

          try {
            console.log(`Uploading document: ${doc.filename}`);
            const docResponse = await apiClient.post('/permit-documents/', docFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log(`Document uploaded successfully:`, docResponse.data);
            uploadedDocCount++;
          } catch (docErr) {
            console.error(`Error uploading document ${doc.filename}:`, docErr);
            console.error(`Response data:`, docErr.response?.data);
            failedDocCount++;
          }
        }
      }

      // Save created IDs for later use
      setCreatedPermitId(permitId);
      if (chalanCreated) {
        setCreatedChalanId(chalanId);
      }

      // Prepare success/warning message
      let resultMessage = `Permit #${permitId} created successfully!`;
      if (chalanCreated) {
        resultMessage += ` + Chalan #${chalanId} created.`;
      }
      if (pendingDocuments.length > 0) {
        resultMessage += ` ${uploadedDocCount} document(s) uploaded`;
        if (failedDocCount > 0) {
          resultMessage += ` (${failedDocCount} document(s) failed to upload)`;
        }
      }

      setMessage({ type: failedDocCount > 0 ? 'warning' : 'success', text: resultMessage });
      setConfirmDialogOpen(false);

      // Reset form and documents
      setFormData({
        authority: 'RTA',
        permit_type_id: '',
        vehicle_number: '',
        vehicle_type_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        vehicle_capacity: '',
        owner_name: '',
        owner_cnic: '',
        owner_email: '',
        owner_phone: '',
        owner_address: '',
        description: '',
        remarks: '',
        restrictions: '',
        approved_routes: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
      });
      setPendingDocuments([]);
      setChalanData({
        owner_name: '',
        owner_cnic: '',
        owner_phone: '',
        car_number: '',
        permit: '',
        vehicle_type: '',
        violation_description: '',
        fees_amount: '',
        remarks: '',
      });
      setAutoCalcFee(true);
      setActiveStep(0);
    } catch (err) {
      console.error('Error creating permit:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message) ||
        'Failed to create permit. Please try again.';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setDraftSaving(true);

      // Only send the fields that have values to avoid validation errors
      const draftPayload = {
        authority: formData.authority || 'RTA',
        permit_type_id: formData.permit_type_id ? parseInt(formData.permit_type_id, 10) : null,
        vehicle_number: formData.vehicle_number || null,
        vehicle_type_id: formData.vehicle_type_id ? parseInt(formData.vehicle_type_id, 10) : null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        vehicle_year: formData.vehicle_year || null,
        vehicle_capacity: formData.vehicle_capacity || null,
        owner_name: formData.owner_name || null,
        owner_cnic: formData.owner_cnic || null,
        owner_email: formData.owner_email || null,
        owner_phone: formData.owner_phone || null,
        owner_address: formData.owner_address || null,
        description: formData.description || null,
        remarks: formData.remarks || null,
        restrictions: formData.restrictions || null,
        approved_routes: formData.approved_routes || null,
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null,
      };

      // Include draft ID if updating existing draft
      if (currentDraftId) {
        draftPayload.id = currentDraftId;
      }

      console.log('Saving draft with payload:', draftPayload);
      const response = await apiClient.post('/permits/save_draft/', draftPayload);
      const draftId = response.data.draft.id;
      setCurrentDraftId(draftId);

      setMessage({
        type: 'success',
        text: `✓ Draft permit saved successfully! You can continue from any device. Draft ID: ${draftId}`,
      });
    } catch (err) {
      console.error('Error saving draft:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.errors ||
        'Failed to save draft. Please try again.';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setDraftSaving(false);
    }
  };

  // Print chalan in three formats (Bank, Department, End User)
  const printChalan = () => {
    if (!createdChalanId || !createdPermitId) {
      alert('No chalan data available to print');
      return;
    }

    const getChalanHeader = (type) => {
      const titles = {
        bank: '🏦 CHALAN FOR BANK',
        department: '🏢 CHALAN FOR DEPARTMENT',
        enduser: '👤 CHALAN FOR END USER',
      };
      return titles[type] || titles.bank;
    };

    const generateChalanHTML = (type) => {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chalan #${createdChalanId} - ${type.toUpperCase()}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .page-break {
              page-break-after: always;
              margin-bottom: 40px;
              padding-bottom: 40px;
              border-bottom: 2px solid #ccc;
            }
            .chalan-container {
              max-width: 700px;
              margin: 0 auto;
              border: 3px solid #1976d2;
              padding: 30px;
              background: linear-gradient(135deg, #f5f7fa 0%, #c8e6c9 100%);
              border-radius: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px double #1976d2;
            }
            .header h1 {
              margin: 0;
              color: #1976d2;
              font-size: 24px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 800;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 12px;
            }
            .receipt-no {
              text-align: center;
              margin: 15px 0;
              background: #fff9c4;
              padding: 10px;
              border-radius: 5px;
              font-weight: bold;
              border: 2px solid #f57f17;
            }
            .section {
              margin: 20px 0;
              padding: 15px;
              background: white;
              border-radius: 5px;
              border-left: 5px solid #1976d2;
            }
            .section-title {
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
              font-size: 14px;
              text-transform: uppercase;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 13px;
              padding: 5px 0;
              border-bottom: 1px dotted #ddd;
            }
            .label {
              font-weight: 600;
              color: #333;
              flex: 0 0 40%;
            }
            .value {
              text-align: right;
              flex: 0 0 60%;
              color: #555;
            }
            .amount-section {
              background: linear-gradient(135deg, #ffeb3b 0%, #fbc02d 100%);
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
              border: 2px solid #f57f17;
            }
            .amount-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .amount {
              font-size: 28px;
              font-weight: bold;
              color: #d32f2f;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #1976d2;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .footer-note {
              margin-top: 10px;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
              font-size: 11px;
              line-height: 1.6;
            }
            .signature-box {
              display: flex;
              justify-content: space-around;
              margin-top: 40px;
              padding-top: 30px;
            }
            .signature {
              text-align: center;
              width: 45%;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 30px;
              padding-top: 5px;
              font-weight: 600;
              font-size: 12px;
            }
            .watermark {
              opacity: 0.1;
              position: fixed;
              font-size: 80px;
              color: #1976d2;
              transform: rotate(-45deg);
              left: 50%;
              top: 50%;
              z-index: -1;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; }
              .watermark { position: fixed; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">${type.toUpperCase()}</div>
          
          <div class="chalan-container">
            <div class="header">
              <h1>${getChalanHeader(type)}</h1>
              <p>Provincial/Regional Transport Authority</p>
              <p>Permit & Vehicle Management System</p>
            </div>

            <div class="receipt-no">
              🔖 CHALAN RECEIPT NO: ${createdChalanId}-${type.substring(0, 1).toUpperCase()}
            </div>

            <div class="section">
              <div class="section-title">📋 Vehicle Information</div>
              <div class="row">
                <div class="label">Registration Number:</div>
                <div class="value">${chalanData.car_number}</div>
              </div>
              <div class="row">
                <div class="label">Vehicle Type:</div>
                <div class="value">${vehicleTypes.find(v => v.id === parseInt(chalanData.vehicle_type))?.name || 'N/A'}</div>
              </div>
              <div class="row">
                <div class="label">Permit Number:</div>
                <div class="value">${createdPermitId}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">👤 Owner Information</div>
              <div class="row">
                <div class="label">Name:</div>
                <div class="value">${chalanData.owner_name}</div>
              </div>
              <div class="row">
                <div class="label">CNIC:</div>
                <div class="value">${chalanData.owner_cnic}</div>
              </div>
              <div class="row">
                <div class="label">Contact:</div>
                <div class="value">${chalanData.owner_phone}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">💬 Fee Description</div>
              <div style="padding: 10px; background: #f5f5f5; border-radius: 5px; min-height: 40px;">
                ${chalanData.violation_description || 'Permit Renewal Fee'}
              </div>
            </div>

            <div class="amount-section">
              <div class="amount-label">TOTAL FEE / CHARGES</div>
              <div class="amount">PKR ${formData.vehicle_capacity || 'N/A'}</div>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">
                Date: ${currentDate}
              </div>
            </div>

            <div class="section" style="background: #e3f2fd;">
              <div class="section-title">📌 Payment Instructions</div>
              <div style="font-size: 12px; line-height: 1.8; color: #333;">
                <div style="margin-bottom: 8px;">
                  ✓ This chalan must be paid within <strong>30 days</strong> from the date of issue.
                </div>
                <div style="margin-bottom: 8px;">
                  ✓ Payment can be made at authorized banks across the country.
                </div>
                <div style="margin-bottom: 8px;">
                  ✓ Keep this receipt as proof of payment.
                </div>
                <div style="margin-bottom: 8px;">
                  ✓ For queries, contact the Transport Authority office.
                </div>
              </div>
            </div>

            <div class="footer">
              <p>This is an official chalan document. Generated on ${currentDate}</p>
              <p>Printed for: <strong>${type === 'bank' ? '🏦 BANK SUBMISSION' : type === 'department' ? '🏢 DEPARTMENT RECORD' : '👤 VEHICLE OWNER'}</strong></p>
              <div class="footer-note">
                <strong>Note:</strong> Please retain this chalan safely. It serves as an official receipt and proof of payment requirement.
              </div>
            </div>

            <div class="signature-box">
              <div class="signature">
                <div class="signature-line">Authorized Officer</div>
              </div>
              <div class="signature">
                <div class="signature-line">Received By</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    // Generate all three versions
    const bankHTML = generateChalanHTML('bank');
    const departmentHTML = generateChalanHTML('department');
    const enduserHTML = generateChalanHTML('enduser');

    // Combine all three with page breaks
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chalan #${createdChalanId} - All Copies</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${bankHTML}
        <div style="page-break-after: always; margin: 40px 0; border-bottom: 2px solid #999;"></div>
        ${departmentHTML}
        <div style="page-break-after: always; margin: 40px 0; border-bottom: 2px solid #999;"></div>
        ${enduserHTML}
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(fullHTML);
    printWindow.document.close();

    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Print chalan preview in wizard step with bank info and warnings
  const printChalanPreview = () => {
    // Validate required fields (check both chalanData and pre-filled formData)
    const ownerName = (chalanData.owner_name || formData.owner_name).trim();
    const carNumber = (chalanData.car_number || formData.vehicle_number).trim();
    const vehicleType = chalanData.vehicle_type || formData.vehicle_type_id;
    const feeDescription = (chalanData.violation_description).trim();

    if (!ownerName || !carNumber || !vehicleType || !feeDescription) {
      alert('Please fill in all required fields before printing.');
      return;
    }

    const getChalanCopy = (type) => {
      const titles = {
        bank: '🏦 BANK COPY',
        user: '👤 USER COPY',
        department: '🏢 DEPARTMENT COPY',
      };
      const colors = {
        bank: '#e3f2fd',
        user: '#f3e5f5',
        department: '#e8f5e9',
      };
      const borders = {
        bank: '#1976d2',
        user: '#7b1fa2',
        department: '#388e3c',
      };

      return `
        <div style="flex: 1; border: 3px solid ${borders[type]}; padding: 15px; margin: 0 10px; background: ${colors[type]}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid ${borders[type]}; padding-bottom: 8px;">
            <h3 style="margin: 0; color: ${borders[type]}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${titles[type]}</h3>
            <p style="margin: 3px 0; color: #666; font-size: 10px;">Payment Receipt</p>
          </div>

          <div style="font-size: 11px; line-height: 1.5;">
            <!-- Owner Info -->
            <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">
              <div style="font-weight: bold; color: ${borders[type]}; margin-bottom: 4px; font-size: 10px;">OWNER</div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px;"><span style="font-weight: 600;">Name:</span><span style="text-align: right;">${chalanData.owner_name || formData.owner_name}</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px;"><span style="font-weight: 600;">CNIC:</span><span style="text-align: right; font-size: 9px;">${chalanData.owner_cnic || formData.owner_cnic}</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px;"><span style="font-weight: 600;">Phone:</span><span style="text-align: right;">${chalanData.owner_phone || formData.owner_phone}</span></div>
            </div>

            <!-- Vehicle Info -->
            <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">
              <div style="font-weight: bold; color: ${borders[type]}; margin-bottom: 4px; font-size: 10px;">VEHICLE</div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px;"><span style="font-weight: 600;">Reg:</span><span style="text-align: right;">${chalanData.car_number || formData.vehicle_number}</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px;"><span style="font-weight: 600;">Type:</span><span style="text-align: right; font-size: 9px;">${vehicleTypes.find(v => v.id === parseInt(chalanData.vehicle_type || formData.vehicle_type_id))?.name || 'N/A'}</span></div>
            </div>

            <!-- Fee Description -->
            <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">
              <div style="font-weight: bold; color: ${borders[type]}; margin-bottom: 3px; font-size: 10px;">FEE</div>
              <div style="font-size: 10px; line-height: 1.3;">${chalanData.violation_description || 'Permit renewal fee'}</div>
            </div>

            <!-- Amount -->
            <div style="background: linear-gradient(135deg, #ffeb3b 0%, #fbc02d 100%); padding: 10px; text-align: center; border-radius: 4px; margin-bottom: 10px; border: 2px solid #f57f17;">
              <div style="font-size: 9px; color: #666; margin-bottom: 3px;">TOTAL DUE</div>
              <div style="font-size: 20px; font-weight: bold; color: #d32f2f;">PKR 5,000</div>
            </div>

            <!-- Bank Account Information -->
            <div style="margin-bottom: 10px; padding: 8px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #1976d2;">
              <div style="font-weight: bold; color: #1976d2; margin-bottom: 3px; font-size: 10px;">BANK DETAILS</div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px;"><span style="font-weight: 600;">Bank:</span><span style="text-align: right;">State Bank of Pakistan</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px;"><span style="font-weight: 600;">Account:</span><span style="text-align: right; font-size: 8px;">Transport Authority</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px;"><span style="font-weight: 600;">A/C No.:</span><span style="text-align: right; font-size: 8px;">12345-6789</span></div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px;"><span style="font-weight: 600;">IBAN:</span><span style="text-align: right; font-size: 8px;">PK36SBOP1234</span></div>
            </div>

            <!-- Payment Reminder (varies by copy) -->
            ${type === 'bank' ? `
              <div style="background: #e3f2fd; padding: 6px; border-left: 3px solid #1976d2; border-radius: 3px; font-size: 9px; color: #0d47a1;">
                <strong>For Bank:</strong> Process payment and return to owner.
              </div>
            ` : type === 'user' ? `
              <div style="background: #ffebee; padding: 6px; border-left: 3px solid #d32f2f; border-radius: 3px; font-size: 9px; color: #b71c1c;">
                <strong>⚠️ CRITICAL:</strong> Pay within 30 days or permit rejected!
              </div>
            ` : `
              <div style="background: #e8f5e9; padding: 6px; border-left: 3px solid #388e3c; border-radius: 3px; font-size: 9px; color: #1b5e20;">
                <strong>Department:</strong> Official records.
              </div>
            `}
          </div>
        </div>
      `;
    };

    const chalanHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Chalan - Three Copies</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            padding: 0;
            background: white;
          }
          .chalan-container {
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: flex-start;
          }
          @media print {
            body { margin: 10px; padding: 0; }
            .chalan-container { gap: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="chalan-container">
          ${getChalanCopy('bank')}
          ${getChalanCopy('user')}
          ${getChalanCopy('department')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(chalanHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Render step components
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderPermitConfiguration();
      case 1:
        return renderVehicleDetails();
      case 2:
        return renderOwnerInformation();
      case 3:
        return renderAdditionalInfo();
      case 4:
        return renderChalanForm();
      case 5:
        return renderDocuments();
      case 6:
        return renderReviewSubmit();
      default:
        return null;
    }
  };

  const renderPermitConfiguration = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📋 Permit Configuration
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled>
            <InputLabel>Authority</InputLabel>
            <Select
              name="authority"
              value={formData.authority}
              onChange={handleChange}
              label="Authority"
              disabled
            >
              <MenuItem value="PTA">Provincial Transport Authority</MenuItem>
              <MenuItem value="RTA">Regional Transport Authority</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={formData.permit_type_id === ''}>
            <InputLabel>Permit Type</InputLabel>
            <Select
              name="permit_type_id"
              value={formData.permit_type_id}
              onChange={handleChange}
              label="Permit Type"
            >
              <MenuItem value="">
                <em>-- Select Permit Type --</em>
              </MenuItem>
              {permitTypes.map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name} ({type.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          borderLeft: '4px solid #1976d2',
        }}
      >
        <Typography variant="body2" sx={{ color: '#0d47a1' }}>
          <strong>ℹ️ Info:</strong> Select a permit type to get started. You'll configure vehicle and owner details in the next steps.
        </Typography>
      </Paper>
    </Box>
  );

  const renderVehicleDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        🚗 Vehicle Details
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Number / Registration"
            name="vehicle_number"
            value={formData.vehicle_number}
            onChange={handleChange}
            placeholder="e.g., ABC-123"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={formData.vehicle_type_id === ''}>
            <InputLabel>Vehicle Type</InputLabel>
            <Select
              name="vehicle_type_id"
              value={formData.vehicle_type_id}
              onChange={handleChange}
              label="Vehicle Type"
            >
              <MenuItem value="">-- Select Type --</MenuItem>
              {vehicleTypes.map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Make / Manufacturer"
            name="vehicle_make"
            value={formData.vehicle_make}
            onChange={handleChange}
            placeholder="e.g., Honda, Toyota"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Model / Variant"
            name="vehicle_model"
            value={formData.vehicle_model}
            onChange={handleChange}
            placeholder="e.g., CR-V, Camry"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Manufacturing Year"
            name="vehicle_year"
            type="number"
            value={formData.vehicle_year}
            onChange={handleChange}
            inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Seating Capacity"
            name="vehicle_capacity"
            type="number"
            value={formData.vehicle_capacity}
            onChange={handleChange}
            inputProps={{ min: 1, max: 300 }}
            variant="outlined"
            required
          />
        </Grid>
      </Grid>
      {formData.vehicle_type_id && formData.valid_from && (
        <Paper
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderLeft: '4px solid #ff9800',
          }}
        >
          <Typography variant="caption" sx={{ color: '#e65100', display: 'block', fontWeight: 600, mb: 1 }}>
            📅 Permit Duration
          </Typography>
          <Typography variant="body2" sx={{ color: '#d84315' }}>
            <strong>
              {vehicleTypes.find((v) => v.id === parseInt(formData.vehicle_type_id))?.name}:
            </strong>{' '}
            {formData.valid_to &&
              `Valid until ${new Date(formData.valid_to).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderOwnerInformation = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        👤 Owner Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
            placeholder="Enter owner name"
            variant="outlined"
            inputProps={{ maxLength: 100 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="CNIC / National ID"
            name="owner_cnic"
            value={formData.owner_cnic}
            onChange={handleChange}
            placeholder="e.g., 12345-1234567-1"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            name="owner_email"
            type="email"
            value={formData.owner_email}
            onChange={handleChange}
            placeholder="owner@example.com"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="owner_phone"
            value={formData.owner_phone}
            onChange={handleChange}
            placeholder="03xxxxxxxxx"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Complete Address"
            name="owner_address"
            multiline
            rows={3}
            value={formData.owner_address}
            onChange={handleChange}
            placeholder="Street address, City, Province"
            variant="outlined"
            required
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAdditionalInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📝 Additional Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the permit purpose"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            multiline
            rows={2}
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Any additional notes or remarks"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Approved Routes"
            name="approved_routes"
            multiline
            rows={2}
            value={formData.approved_routes}
            onChange={handleChange}
            placeholder="e.g., Route 1: City A to City B"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Restrictions & Conditions"
            name="restrictions"
            multiline
            rows={2}
            value={formData.restrictions}
            onChange={handleChange}
            placeholder="e.g., Only weekdays, Not during peak hours"
            variant="outlined"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      filename: file.name,
      size: file.size,
    }));

    setPendingDocuments([...pendingDocuments, ...newDocs]);
    e.target.value = ''; // Reset file input
  };

  const handleRemoveDocument = (docId) => {
    setPendingDocuments(pendingDocuments.filter((doc) => doc.id !== docId));
  };

  const renderDocuments = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📎 Documents Submission
      </Typography>

      {/* Document Types Guide */}
      <Paper
        sx={{
          p: 2.5,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          borderLeft: '5px solid #388e3c',
          borderRadius: '8px',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1b5e20', mb: 2 }}>
          📋 Recommended Documents (All Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>
              <Typography variant="body2" sx={{ color: '#1b5e20', mb: 1, fontSize: '13px' }}>
                <strong>💰 Payment Chalan:</strong> Proof of the permit fee/chalan for payment to the bank
              </Typography>
              <Typography variant="body2" sx={{ color: '#1b5e20', mb: 1, fontSize: '13px' }}>
                <strong>📄 Old Permit:</strong> Copy of previous/existing permit (if renewal)
              </Typography>
              <Typography variant="body2" sx={{ color: '#1b5e20', mb: 1, fontSize: '13px' }}>
                <strong>🚗 Car Documents:</strong> Registration certificate, insurance, fitness certificate
              </Typography>
              <Typography variant="body2" sx={{ color: '#1b5e20', fontSize: '13px' }}>
                <strong>📎 Other Information:</strong> Any additional supporting documents
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Upload Section */}
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          border: '2px dashed #1976d2',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)',
          },
        }}
      >
        <input
          type="file"
          id="document-upload"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        <label htmlFor="document-upload" style={{ cursor: 'pointer', display: 'block' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            📤 Upload Documents
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
            Click to select or drag & drop files here
          </Typography>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
          </Typography>
        </label>
      </Paper>

      {/* Pending Documents List */}
      {pendingDocuments.length > 0 && (
        <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', borderLeft: '4px solid #fbc02d' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57f17', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ⏳ Uploaded Documents ({pendingDocuments.length})
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', mb: 2, display: 'block' }}>
            These files will be submitted when you finalize the permit
          </Typography>
          <Grid container spacing={2}>
            {pendingDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #fffde7 0%, #fffce4 100%)',
                    border: '1px solid #fbc02d',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', wordBreak: 'break-word', flex: 1 }}>
                      📄 {doc.filename}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    {(doc.size / 1024).toFixed(2)} KB
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                    ✓ Ready to Submit
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleRemoveDocument(doc.id)}
                    sx={{
                      fontSize: '12px',
                      color: '#f57f17',
                      borderColor: '#f57f17',
                      '&:hover': {
                        backgroundColor: '#fff9c4',
                      },
                    }}
                  >
                    Remove
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

    </Box>
  );

  const renderReviewSubmit = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        ✓ Review & Submit
      </Typography>
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)' }}>
        <Grid container spacing={3}>
          {/* Permit Configuration */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              📋 Permit Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Authority
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.authority === 'PTA' ? 'Provincial Transport Authority' : 'Regional Transport Authority'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Permit Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {permitTypes.find((t) => t.id === parseInt(formData.permit_type_id))?.name}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Vehicle Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              🚗 Vehicle Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Vehicle
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_make} {formData.vehicle_model} ({formData.vehicle_year})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Registration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_number}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Vehicle Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {vehicleTypes.find((v) => v.id === parseInt(formData.vehicle_type_id))?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Capacity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_capacity} seats
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Owner Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              👤 Owner Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  CNIC
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_cnic}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Phone
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_address}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Validity Period */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              📅 Validity Period
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Valid From
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(formData.valid_from).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Valid To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(formData.valid_to).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Documents */}
          {pendingDocuments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
                📎 Documents to Upload
              </Typography>
              <Grid container spacing={2}>
                {pendingDocuments.map((doc) => (
                  <Grid item xs={12} sm={6} key={doc.id}>
                    <Paper
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        borderLeft: '4px solid #4caf50',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#1b5e20', display: 'block' }}>
                        📄 File
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32', wordBreak: 'break-word' }}>
                        {doc.filename}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#558b2f', display: 'block', mt: 0.5 }}>
                        {(doc.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, p: 2, background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: '#1b5e20', fontWeight: 600 }}>
            ✓ All information looks correct. Click Submit to create the permit{pendingDocuments.length > 0 ? ` and upload ${pendingDocuments.length} document(s)` : ''}.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  const renderChalanForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        � Permit Fees (Chalan)
      </Typography>

      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          borderLeft: '4px solid #4caf50',
        }}
      >
        <Typography variant="body2" sx={{ color: '#1b5e20' }}>
          <strong>✓ Auto-filled:</strong> The following information has been pre-filled from your permit details. You can edit them as needed.
        </Typography>
      </Paper>

      {!isEmployeeOrAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>ℹ️ Notice:</strong> As an end user, you can only view and print this chalan information for reference. Only employees and administrators can modify and finalize chalans.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Owner Name"
            name="owner_name"
            value={chalanData.owner_name || formData.owner_name}
            onChange={handleChalanInputChange}
            placeholder="Enter owner name"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Owner CNIC"
            name="owner_cnic"
            value={chalanData.owner_cnic || formData.owner_cnic}
            onChange={handleChalanInputChange}
            placeholder="e.g., 12345-1234567-1"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Owner Phone"
            name="owner_phone"
            value={chalanData.owner_phone || formData.owner_phone}
            onChange={handleChalanInputChange}
            placeholder="03xxxxxxxxx"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Car Number / Vehicle Registration"
            name="car_number"
            value={chalanData.car_number || formData.vehicle_number}
            onChange={handleChalanInputChange}
            placeholder="e.g., ABC-123"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Vehicle Type</InputLabel>
            <Select
              name="vehicle_type"
              value={chalanData.vehicle_type || formData.vehicle_type_id}
              onChange={handleChalanInputChange}
              label="Vehicle Type"
            >
              <MenuItem value="">-- Select Type --</MenuItem>
              {vehicleTypes.map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Make"
            value={formData.vehicle_make}
            variant="outlined"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Model"
            value={formData.vehicle_model}
            variant="outlined"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Year"
            value={formData.vehicle_year}
            variant="outlined"
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Fee Description / Reason"
            name="violation_description"
            multiline
            rows={3}
            value={chalanData.violation_description}
            onChange={handleChalanInputChange}
            placeholder="e.g., Permit renewal fee, late payment, etc."
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoCalcFee}
                disabled
              />
            }
            label="Auto-calculate fee (System will calculate)"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            multiline
            rows={2}
            value={chalanData.remarks}
            onChange={handleChalanInputChange}
            placeholder="Additional notes"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<PrintIcon />}
          onClick={printChalanPreview}
          sx={{
            textTransform: 'none',
            fontSize: '16px',
            px: 3,
            py: 1.2,
          }}
        >
          🖨️ Print Chalan Preview
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          borderLeft: '4px solid #1976d2',
        }}
      >
        <Typography variant="body2" sx={{ color: '#0d47a1' }}>
          <strong>ℹ️ Info:</strong> Optional - Specify permit fees/charges to be included with this permit. Leave blank to skip this step.
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(21, 101, 192, 0.04) 100%)',
          borderRadius: '8px',
          p: 2.5,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Create New Permit or Chalan
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '1rem' }}>
          Follow the steps below to create a new permit with optional chalan
        </Typography>
      </Box>

      {message && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Alert
            severity={message.type}
            sx={{ flex: 1, borderRadius: '8px' }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
          {message.type === 'success' && createdChalanId && (
            <Button
              variant="contained"
              color="info"
              startIcon={<PrintIcon />}
              onClick={printChalan}
              sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
            >
              Print Chalan
            </Button>
          )}
        </Box>
      )}

      {/* Permit Form with Chalan Step */}
      <Card sx={{ mb: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)', borderBottom: '1px solid #e0e0e0' }}>
          <Stepper activeStep={activeStep} sx={{ p: 3 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '14px',
                      fontWeight: 500,
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      fontWeight: 600,
                      color: '#1976d2',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <CardContent sx={{ p: 4, minHeight: '400px' }}>
          {renderStep()}
        </CardContent>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            p: 3,
            backgroundColor: '#f5f7fa',
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              sx={{
                borderColor: '#ccc',
                color: '#666',
                '&:hover': {
                  borderColor: '#999',
                  backgroundColor: '#f9f9f9',
                },
              }}
            >
              Back
            </Button>

            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={loading || draftSaving}
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  borderColor: '#f57c00',
                  backgroundColor: '#fff3e0',
                },
              }}
            >
              {draftSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
          </Box>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<NextIcon />}
              onClick={handleNext}
              disabled={!validateStep(activeStep) || loading}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                paddingX: 4,
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.6)',
                },
                '&:disabled': {
                  boxShadow: 'none',
                },
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<SubmitIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!validateStep(activeStep) || loading}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                paddingX: 4,
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.6)',
                },
                '&:disabled': {
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </Box>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            padding: '20px 24px',
          }}
        >
          <SubmitIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirm Permit Creation
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Please review the information before submitting
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to create this permit with the information provided?
          </Typography>
          <Alert severity="info">All changes will be saved and cannot be immediately undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Permit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* My Drafts Dialog */}
      <Dialog open={showDraftsDialog} onClose={() => setShowDraftsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            color: 'white',
            padding: '20px 24px',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Resume Saved Drafts
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              You have {userDrafts.length} saved draft(s). Load one to continue.
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loadingDrafts ? (
            <Typography>Loading your drafts...</Typography>
          ) : userDrafts.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {userDrafts.map((draft) => (
                <Card
                  key={draft.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      borderColor: '#2196f3',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => handleLoadDraft(draft)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {draft.vehicle_number || 'Vehicle Number Not Entered'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Owner: {draft.owner_name || 'Not Entered'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                        Last Modified: {new Date(draft.last_modified).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography
                      variant="badge"
                      sx={{
                        background: '#e3f2fd',
                        color: '#2196f3',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      DRAFT
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>No saved drafts found</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 2 }}>
          <Button
            onClick={() => setShowDraftsDialog(false)}
            variant="outlined"
          >
            Start New
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NewPermit;
