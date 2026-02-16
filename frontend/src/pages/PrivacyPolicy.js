import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, backgroundColor: '#fff' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
          Privacy Policy
        </Typography>
        <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block', mb: 3 }}>
          Last updated: January 25, 2026
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            1. Introduction
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            The PTA & RTA Permit Management System ("we", "our", or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            2. Information We Collect
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem>
              <ListItemText
                primary="Personal Information"
                secondary="Username, email address, password, first name, last name, and other account details you provide."
                primaryTypographyProps={{ sx: { fontWeight: 600, mb: 1 } }}
                secondaryTypographyProps={{ sx: { color: 'textSecondary' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Permit Information"
                secondary="Details about permits you create, edit, or manage, including vehicle and owner information."
                primaryTypographyProps={{ sx: { fontWeight: 600, mb: 1 } }}
                secondaryTypographyProps={{ sx: { color: 'textSecondary' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Usage Data"
                secondary="Information about your interactions with the system, including login times and actions performed."
                primaryTypographyProps={{ sx: { fontWeight: 600, mb: 1 } }}
                secondaryTypographyProps={{ sx: { color: 'textSecondary' } }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            We use the information we collect to:
          </Typography>
          <List sx={{ pl: 2, mt: 1 }}>
            <ListItem>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>• Provide and maintain our service</Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>• Notify you about changes to our service</Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>• Ensure the security of your account</Typography>
            </ListItem>
            <ListItem>
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>• Improve our service and user experience</Typography>
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            4. Data Security
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            The security of your data is important to us but remember that no method of transmission over the Internet
            or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect
            your personal information, we cannot guarantee its absolute security.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            5. Contact Us
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            If you have any questions about this Privacy Policy, please contact us at support@ptarta-permits.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPolicy;
