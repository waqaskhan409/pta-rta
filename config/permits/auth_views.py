from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import Token, UserRole
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, UserDetailSerializer
import secrets


class AuthViewSet(viewsets.ViewSet):
    """
    API endpoint for user authentication (register, login, logout)
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register a new user
        POST /api/auth/register/
        {
            "username": "john_doe",
            "email": "john@example.com",
            "password": "securepassword123",
            "password2": "securepassword123",
            "first_name": "John",
            "last_name": "Doe"
        }
        """
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Assign end_user role automatically to new users
            try:
                from .models import Role
                end_user_role = Role.objects.get(name='end_user')
                UserRole.objects.create(
                    user=user,
                    role=end_user_role,
                    is_active=True
                )
            except Role.DoesNotExist:
                # If end_user role doesn't exist, log warning but don't fail registration
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"end_user role not found when registering user {user.username}")
            except Exception as e:
                # If UserRole creation fails, log warning but don't fail registration
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to assign end_user role to user {user.username}: {str(e)}")
            
            # Create token for the new user
            token_key = secrets.token_urlsafe(32)
            token = Token.objects.create(user=user, key=token_key)
            return Response({
                'status': 'success',
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        Login a user
        POST /api/auth/login/
        {
            "username": "john_doe",
            "password": "securepassword123"
        }
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Get or create token
            token = Token.objects.filter(user=user).first()
            if not token:
                token_key = secrets.token_urlsafe(32)
                token = Token.objects.create(user=user, key=token_key)
            
            # Get user details with role information
            user_serializer = UserDetailSerializer(user)
            
            return Response({
                'status': 'success',
                'message': 'Login successful',
                'user': user_serializer.data,
                'token': token.key
            }, status=status.HTTP_200_OK)
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def user(self, request):
        """
        Get current user profile
        GET /api/auth/user/
        """
        user_serializer = UserDetailSerializer(request.user)
        return Response({
            'status': 'success',
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """
        Logout a user (delete token)
        POST /api/auth/logout/
        """
        try:
            Token.objects.filter(user=request.user).delete()
            return Response({
                'status': 'success',
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except:
            return Response({
                'status': 'error',
                'message': 'Logout failed'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint
    GET /api/health/
    """
    return Response({
        'status': 'success',
        'message': 'API is running'
    }, status=status.HTTP_200_OK)
