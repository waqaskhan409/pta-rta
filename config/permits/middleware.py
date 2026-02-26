"""
Security middleware for protecting APIs
"""
import time
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware to prevent API abuse
    Limits requests based on IP address
    Disabled in DEBUG mode (development)
    """
    RATE_LIMIT = 100  # requests per minute
    
    def process_request(self, request):
        # Skip rate limiting in debug mode (development)
        if settings.DEBUG:
            return None
        
        # Skip rate limiting for admin and static files
        if request.path.startswith('/admin') or request.path.startswith('/static'):
            return None
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Create cache key
        cache_key = f'rate_limit:{client_ip}'
        
        # Get current count
        request_count = cache.get(cache_key, 0)
        
        # Check if limit exceeded
        if request_count >= self.RATE_LIMIT:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JsonResponse(
                {'error': 'Rate limit exceeded. Maximum 100 requests per minute allowed.'},
                status=429
            )
        
        # Increment counter
        cache.set(cache_key, request_count + 1, 60)  # Reset every 60 seconds
        
        return None
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class APIKeyAuthMiddleware(MiddlewareMixin):
    """
    Custom middleware for API key validation
    """
    
    def process_request(self, request):
        # Skip middleware for admin, static files, and public endpoints
        if any(request.path.startswith(path) for path in ['/admin', '/static', '/api/auth']):
            return None
        
        # Skip GET requests for now (only protect write operations)
        if request.method == 'GET':
            return None
        
        # Check for API key in headers
        api_key = request.META.get('HTTP_X_API_KEY')
        
        if not api_key:
            logger.warning(f"Missing API key for {request.method} {request.path} from {self.get_client_ip(request)}")
            return JsonResponse(
                {'error': 'Missing API key. Please provide X-API-Key header.'},
                status=401
            )
        
        return None
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    
    def process_response(self, request, response):
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Enforce HTTPS (in production)
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Prevent referrer leaking - use no-referrer for local dev to allow CORS
        response['Referrer-Policy'] = 'no-referrer'
        
        # Control feature policies
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # CSP header
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all API requests and responses for security auditing
    """
    
    def process_request(self, request):
        request.start_time = time.time()
        logger.info(f"Incoming {request.method} {request.path} from {self.get_client_ip(request)}")
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(
                f"Response {response.status_code} {request.method} {request.path} "
                f"completed in {duration:.2f}s from {self.get_client_ip(request)}"
            )
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
