"""
User management views - only accessible to admins
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Q

from .models import Role, Feature, UserRole
from .serializers import (
    UserDetailSerializer, RoleSerializer, FeatureSerializer,
    UserRoleSerializer, UserSerializer
)
from .authentication import IsAdmin, HasFeature


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User management - Admin only
    Endpoints:
    - GET /api/users/ - List all users
    - GET /api/users/{id}/ - Get user details
    - POST /api/users/ - Create new user (admin only)
    - PUT /api/users/{id}/ - Update user
    - DELETE /api/users/{id}/ - Delete user (admin only)
    - POST /api/users/{id}/assign-role/ - Assign role to user
    - POST /api/users/{id}/remove-role/ - Remove role from user
    """
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserDetailSerializer
        return UserDetailSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def check_admin_status(self, request):
        """
        Check if current user is admin - DEBUG ENDPOINT
        GET /api/users/check-admin-status/
        """
        user = request.user
        
        # Check various admin indicators
        is_staff = user.is_staff
        is_superuser = user.is_superuser
        
        has_user_role = hasattr(user, 'user_role')
        user_role = None
        role_name = None
        role_is_active = None
        user_role_exists = False
        
        if has_user_role:
            try:
                user_role = user.user_role
                user_role_exists = True
                role_name = user_role.role.name if user_role.role else None
                role_is_active = user_role.is_active if user_role else False
            except Exception as e:
                user_role_exists = False
        
        # Determine admin status
        is_admin = is_staff or (has_user_role and user_role_exists and role_name == 'admin')
        
        return Response({
            'username': user.username,
            'is_staff': is_staff,
            'is_superuser': is_superuser,
            'has_user_role': has_user_role,
            'user_role_exists': user_role_exists,
            'role_name': role_name,
            'role_is_active': role_is_active,
            'is_admin': is_admin,
            'can_access_users_endpoint': is_admin
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def assign_role(self, request, pk=None):
        """
        Assign a role to a user
        POST /api/users/{id}/assign-role/
        {
            "role_id": 1,
            "notes": "Optional notes"
        }
        """
        user = self.get_object()
        role_id = request.data.get('role_id')
        notes = request.data.get('notes', '')

        if not role_id:
            return Response(
                {'error': 'role_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            role = Role.objects.get(id=role_id, is_active=True)
        except Role.DoesNotExist:
            return Response(
                {'error': 'Role not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create or update user role
        user_role, created = UserRole.objects.update_or_create(
            user=user,
            defaults={
                'role': role,
                'assigned_by': request.user,
                'is_active': True,
                'notes': notes
            }
        )

        serializer = UserRoleSerializer(user_role)
        message = "Role assigned successfully" if created else "Role updated successfully"
        return Response(
            {'status': 'success', 'message': message, 'data': serializer.data},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def remove_role(self, request, pk=None):
        """
        Remove role from a user
        POST /api/users/{id}/remove-role/
        """
        user = self.get_object()

        try:
            user_role = UserRole.objects.get(user=user)
            role_name = user_role.role.get_name_display()
            user_role.is_active = False
            user_role.save()

            return Response(
                {'status': 'success', 'message': f'Role {role_name} removed successfully'},
                status=status.HTTP_200_OK
            )
        except UserRole.DoesNotExist:
            return Response(
                {'error': 'User has no assigned role'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def inactive_users(self, request):
        """
        Get all inactive users
        GET /api/users/inactive-users/
        """
        inactive_users = User.objects.filter(is_active=False)
        serializer = self.get_serializer(inactive_users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def deactivate(self, request, pk=None):
        """
        Deactivate a user account
        POST /api/users/{id}/deactivate/
        """
        user = self.get_object()
        user.is_active = False
        user.save()

        return Response(
            {'status': 'success', 'message': f'User {user.username} deactivated'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def activate(self, request, pk=None):
        """
        Activate a user account
        POST /api/users/{id}/activate/
        """
        user = self.get_object()
        user.is_active = True
        user.save()

        return Response(
            {'status': 'success', 'message': f'User {user.username} activated'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def create_user(self, request):
        """
        Create a new user with role assignment
        POST /api/users/create-user/
        {
            "username": "john_doe",
            "email": "john@example.com",
            "password": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "role_id": 2
        }
        """
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role_id = request.data.get('role_id')

        # Validation
        if not all([username, email, password]):
            return Response(
                {'error': 'username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username {username} already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': f'Email {email} already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            # Assign role if provided
            if role_id:
                try:
                    role = Role.objects.get(id=role_id, is_active=True)
                    UserRole.objects.create(
                        user=user,
                        role=role,
                        assigned_by=request.user,
                        notes=f'User created by {request.user.username}'
                    )
                except Role.DoesNotExist:
                    user.delete()
                    return Response(
                        {'error': 'Role not found or inactive'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = UserDetailSerializer(user)
            return Response(
                {'status': 'success', 'message': 'User created successfully', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Role management - Admin only
    Endpoints:
    - GET /api/roles/ - List all roles
    - GET /api/roles/{id}/ - Get role details
    - POST /api/roles/ - Create new role
    - PUT /api/roles/{id}/ - Update role
    - DELETE /api/roles/{id}/ - Delete role
    - POST /api/roles/{id}/add-feature/ - Add feature to role
    - POST /api/roles/{id}/remove-feature/ - Remove feature from role
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def add_feature(self, request, pk=None):
        """
        Add a feature to a role
        POST /api/roles/{id}/add-feature/
        {
            "feature_id": 1
        }
        """
        role = self.get_object()
        feature_id = request.data.get('feature_id')

        if not feature_id:
            return Response(
                {'error': 'feature_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            feature = Feature.objects.get(id=feature_id)
            role.features.add(feature)
            serializer = self.get_serializer(role)
            return Response(
                {'status': 'success', 'message': 'Feature added to role', 'data': serializer.data},
                status=status.HTTP_200_OK
            )
        except Feature.DoesNotExist:
            return Response(
                {'error': 'Feature not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def remove_feature(self, request, pk=None):
        """
        Remove a feature from a role
        POST /api/roles/{id}/remove-feature/
        {
            "feature_id": 1
        }
        """
        role = self.get_object()
        feature_id = request.data.get('feature_id')

        if not feature_id:
            return Response(
                {'error': 'feature_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            feature = Feature.objects.get(id=feature_id)
            role.features.remove(feature)
            serializer = self.get_serializer(role)
            return Response(
                {'status': 'success', 'message': 'Feature removed from role', 'data': serializer.data},
                status=status.HTTP_200_OK
            )
        except Feature.DoesNotExist:
            return Response(
                {'error': 'Feature not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class FeatureViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Feature/Permission management - Read only for authenticated users
    All authenticated users can view features
    Endpoints:
    - GET /api/features/ - List all features
    - GET /api/features/{id}/ - Get feature details
    """
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
