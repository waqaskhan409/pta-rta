"""
Custom authentication and permission classes for API security
"""
from rest_framework import authentication, permissions, status
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.conf import settings
import os
import logging
import binascii

logger = logging.getLogger(__name__)


class TokenAuthentication(authentication.BaseAuthentication):
    """
    Custom token authentication
    Client must provide Authorization header with "Token <token_key>"
    """
    keyword = 'Token'
    
    def get_model(self):
        from .models import Token
        return Token

    def authenticate(self, request):
        """
        Authenticate the request using token from Authorization header
        """
        auth = authentication.get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None  # No token, continue to next auth method

        if len(auth) == 1:
            msg = 'Invalid token header. No credentials provided.'
            raise AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = 'Invalid token header. Token string should not contain spaces.'
            raise AuthenticationFailed(msg)

        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise AuthenticationFailed(msg)

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, key):
        """
        Authenticate the token key
        """
        model = self.get_model()
        try:
            token = model.objects.select_related('user').get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted.')

        return (token.user, token)

    def authenticate_header(self, request):
        return self.keyword


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Simple API key authentication
    Client must provide X-API-Key header
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using API key from header
        """
        api_key = request.META.get('HTTP_X_API_KEY')
        
        if not api_key:
            return None  # No API key, continue to next auth method
        
        # Validate API key (you can store valid keys in database or env)
        valid_keys = os.getenv('VALID_API_KEYS', '').split(',')
        
        if api_key not in valid_keys:
            logger.warning(f"Invalid API key attempt: {api_key[:10]}...")
            raise AuthenticationFailed('Invalid API key')
        
        # Return authenticated user (you can create a custom user object)
        user = User.objects.filter(username='api_user').first()
        if not user:
            user = User.objects.create_user(
                username='api_user',
                email='api@transport.local'
            )
        
        return (user, None)


class IsAuthenticated(permissions.BasePermission):
    """
    Allow only authenticated users (with valid API key or token)
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdminUser(permissions.BasePermission):
    """
    Allow only admin users
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsSafeMethod(permissions.BasePermission):
    """
    Allow safe methods (GET, HEAD, OPTIONS) without authentication
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Allow owner to edit/delete their own permits
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.created_by == request.user


class CanCreatePermit(permissions.BasePermission):
    """
    Allow users with permit_create feature to create permits.
    Includes admins and end_users with appropriate role.
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always create permits
        if request.user.is_staff:
            return True
        
        # Check if user has permit_create feature through their role
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('permit_create')
        except Exception as e:
            logger.debug(f"Error checking permit_create permission: {e}")
        
        return False


class CanUpdatePermit(permissions.BasePermission):
    """
    Allow users with permit_edit feature to update permits.
    Includes admins and end_users with appropriate role.
    """
    
    def has_permission(self, request, view):
        if request.method not in ['PUT', 'PATCH']:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always update permits
        if request.user.is_staff:
            return True
        
        # Check if user has permit_edit feature through their role
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('permit_edit')
        except Exception as e:
            logger.debug(f"Error checking permit_edit permission: {e}")
        
        return False


class CanDeletePermit(permissions.BasePermission):
    """
    Allow only admin users to delete permits
    """
    
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return bool(request.user and request.user.is_staff)
        return True


class HasFeature(permissions.BasePermission):
    """
    Check if user has a specific feature/permission
    Usage: permission_classes = [HasFeature]
    In view: required_feature = 'permit_create'
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        required_feature = getattr(view, 'required_feature', None)
        if not required_feature:
            return True
        
        try:
            user_role = request.user.user_role
            if not user_role.is_active or not user_role.role:
                return False
            return user_role.role.has_feature(required_feature)
        except:
            return False


class HasAnyFeature(permissions.BasePermission):
    """
    Check if user has any of the specified features
    Usage: permission_classes = [HasAnyFeature]
    In view: required_features = ['permit_view', 'permit_create']
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        required_features = getattr(view, 'required_features', [])
        if not required_features:
            return True
        
        try:
            user_role = request.user.user_role
            if not user_role.is_active or not user_role.role:
                return False
            
            for feature in required_features:
                if user_role.role.has_feature(feature):
                    return True
            return False
        except:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Check if user has admin role
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # First check if user is a Django staff user
        if request.user.is_staff:
            return True
        
        # Then check for admin role assignment
        try:
            user_role = request.user.user_role
            if user_role and user_role.is_active and user_role.role:
                is_admin = user_role.role.name == 'admin'
                if is_admin:
                    return True
        except (AttributeError, Exception) as e:
            logger.debug(f"Error checking user role for {request.user.username}: {e}")
        
        # If neither condition is met, deny access
        return False


class CanAssignPermit(permissions.BasePermission):
    """
    Allow users with permit_assign feature to assign permits to users.
    Includes admins and end_users with appropriate role.
    """
    
    def has_permission(self, request, view):
        if request.method not in ['PUT', 'PATCH', 'POST']:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always assign permits
        if request.user.is_staff:
            return True
        
        # Check if user has permit_assign feature through their role
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('permit_assign')
        except Exception as e:
            logger.debug(f"Error checking permit_assign permission: {e}")
        
        return False


def can_assign_to_user(request, target_user):
    """
    Check if current user can assign permits to target user.
    """
    if not request.user or not request.user.is_authenticated:
        return False
    
    # Admins can assign to anyone
    if request.user.is_staff:
        return True
    
    # Users can only assign to users in their zone if applicable
    try:
        from .models import UserRole
        user_role = UserRole.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if user_role and user_role.role:
            if user_role.role.has_feature('permit_assign'):
                # Additional zone-based restriction could go here
                return True
    except Exception as e:
        logger.debug(f"Error in can_assign_to_user: {e}")
    
    return False


class CanManagePermitDocument(permissions.BasePermission):
    """
    Allow users to manage (upload/delete) documents for permits.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always manage documents
        if request.user.is_staff:
            return True
        
        # Check if user has permit_edit feature (they can manage docs for permits they can edit)
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('permit_edit') or user_role.role.has_feature('permit_create')
        except Exception as e:
            logger.debug(f"Error checking permit document permission: {e}")
        
        return False


def get_user_role(user):
    """
    Get the role for a user
    """
    try:
        from .models import UserRole
        user_role = UserRole.objects.filter(
            user=user,
            is_active=True
        ).first()
        
        if user_role:
            return user_role.role
    except Exception as e:
        logger.debug(f"Error getting user role: {e}")
    
    return None


# Chalan Permission Classes

class CanViewChalan(permissions.BasePermission):
    """
    Allow users with chalan_view feature to view chalans.
    """
    
    def has_permission(self, request, view):
        if request.method not in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always view
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_view')
        except Exception as e:
            logger.debug(f"Error checking chalan_view permission: {e}")
        
        return False


class CanCreateChalan(permissions.BasePermission):
    """
    Allow users with chalan_create feature to create chalans.
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always create
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_create')
        except Exception as e:
            logger.debug(f"Error checking chalan_create permission: {e}")
        
        return False


class CanEditChalan(permissions.BasePermission):
    """
    Allow users with chalan_edit feature to edit chalans.
    """
    
    def has_permission(self, request, view):
        if request.method not in ['PUT', 'PATCH']:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always edit
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_edit')
        except Exception as e:
            logger.debug(f"Error checking chalan_edit permission: {e}")
        
        return False


class CanManageChalanFees(permissions.BasePermission):
    """
    Allow users with chalan_manage_fees feature to manage chalan fees.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always manage
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_manage_fees')
        except Exception as e:
            logger.debug(f"Error checking chalan_manage_fees permission: {e}")
        
        return False


class CanMarkChalanAsPaid(permissions.BasePermission):
    """
    Allow users with chalan_mark_paid feature to mark chalans as paid.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always mark as paid
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_mark_paid')
        except Exception as e:
            logger.debug(f"Error checking chalan_mark_paid permission: {e}")
        
        return False


class CanCancelChalan(permissions.BasePermission):
    """
    Allow users with chalan_cancel feature or admins to cancel chalans.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can always cancel
        if request.user.is_staff:
            return True
        
        try:
            from .models import UserRole
            user_role = UserRole.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if user_role and user_role.role:
                return user_role.role.has_feature('chalan_cancel')
        except Exception as e:
            logger.debug(f"Error checking chalan_cancel permission: {e}")
        
        return False
