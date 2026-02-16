import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  LocalShipping as VehicleIcon,
  ReceiptLong as PermitIcon,
} from '@mui/icons-material';
import TypeManager from '../components/TypeManager';
import '../styles/page.css';

function TypesManagement() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🏷️ Manage Types
        </Typography>
      </Toolbar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<PermitIcon sx={{ mr: 1 }} />}
            label="Permit Types"
            iconPosition="start"
          />
          <Tab
            icon={<VehicleIcon sx={{ mr: 1 }} />}
            label="Vehicle Types"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && (
          <TypeManager
            title="Permit Type"
            endpoint="/permit-types/"
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && (
          <TypeManager
            title="Vehicle Type"
            endpoint="/vehicle-types/"
          />
        )}
      </Box>
    </Container>
  );
}

export default TypesManagement;
