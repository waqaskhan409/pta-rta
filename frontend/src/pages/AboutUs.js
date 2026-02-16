import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

function AboutUs() {
  const features = [
    {
      icon: <InfoIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
      title: 'Comprehensive Management',
      description: 'Streamline your permit management process with an intuitive and comprehensive system.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security ensures your data is protected and always available.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
      title: 'Fast & Efficient',
      description: 'Quickly issue, manage, and renew permits with our optimized workflow.'
    },
    {
      icon: <SupportIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
      title: 'Dedicated Support',
      description: 'Get timely assistance with our responsive support team.'
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, backgroundColor: '#fff' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
          About PTA & RTA Permit Management System
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            Our Mission
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            We are dedicated to providing a comprehensive, user-friendly platform for managing PTA (Public Transport Authority)
            and RTA (Road Transport Authority) permits. Our goal is to simplify the permit management process, reduce
            administrative burden, and improve operational efficiency for government agencies and transport operators.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            Our Vision
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            To be the leading digital solution for permit management, enabling organizations to operate efficiently
            and transparently in the modern age.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
          Why Choose Us?
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card sx={{
                height: '100%',
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  borderColor: '#1976d2',
                }
              }}>
                <CardContent sx={{ display: 'flex', gap: 2 }}>
                  <Box>{feature.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            Contact Information
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8, mb: 1 }}>
            <strong>Email:</strong> support@ptarta-permits.com
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8, mb: 1 }}>
            <strong>Phone:</strong> +92-300-0000-000
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary', lineHeight: 1.8 }}>
            <strong>Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default AboutUs;
