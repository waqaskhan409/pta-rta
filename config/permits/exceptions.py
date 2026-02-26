"""
Custom exception handler for API responses
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Log the exception
    logger.error(f"API Exception: {exc.__class__.__name__}: {str(exc)}")
    
    if response is not None:
        # Add custom formatting to error response
        if isinstance(response.data, dict):
            response.data = {
                'status': 'error',
                'code': response.status_code,
                'message': response.data.get('detail', str(response.data)),
                'errors': response.data
            }
        else:
            response.data = {
                'status': 'error',
                'code': response.status_code,
                'message': str(response.data)
            }
    
    return response
