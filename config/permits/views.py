from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Permit, PermitHistory, PermitDocument, PermitType, VehicleType, UserRole, Chalan, ChalanHistory, Event, EventLog, VehicleFeeStructure, Notification
from .serializers import PermitSerializer, PermitHistorySerializer, PermitDocumentSerializer, PermitStatsSerializer, PermitTypeSerializer, VehicleTypeSerializer, VehicleFeeStructureSerializer, VehicleFeeStructureCreateSerializer, VehicleFeeStructureUpdateSerializer, ChalanHistorySerializer, NotificationSerializer, NotificationListSerializer
from .authentication import CanCreatePermit, CanUpdatePermit, CanDeletePermit, IsAdminUser, HasFeature, IsAdmin, CanAssignPermit, can_assign_to_user, get_user_role, CanManagePermitDocument


class PermitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Permit CRUD operations and related actions
    """
    queryset = Permit.objects.all()
    serializer_class = PermitSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicle_number', 'owner_name', 'owner_email', 'permit_number']
    ordering_fields = ['issued_date', 'valid_to', 'status']
    ordering = ['-issued_date']
    
    def get_available_junior_clerk(self):
        """
        Get the next available junior clerk with the least assigned permits (load balancing).
        Returns the junior clerk with the fewest active assigned permits.
        Returns None if no junior clerk is found.
        """
        try:
            # Get all junior clerks who are active
            junior_clerks = UserRole.objects.filter(
                is_active=True,
                role__name='junior_clerk'
            ).select_related('user')
            
            if not junior_clerks.exists():
                return None
            
            # Get the junior clerk with the least assigned permits
            least_assigned_clerk = None
            min_permit_count = float('inf')
            
            for user_role in junior_clerks:
                user = user_role.user
                # Count active assigned permits for this clerk
                permit_count = Permit.objects.filter(
                    assigned_to=user,
                    status__in=['active', 'pending']
                ).count()
                
                if permit_count < min_permit_count:
                    min_permit_count = permit_count
                    least_assigned_clerk = user
            
            return least_assigned_clerk
        except Exception as e:
            print(f"Error getting available junior clerk: {e}")
            return None
    
    def get_client_ip_debug(self, request):
        """Debug helper to get client IP"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get_assignable_users(self, request_user):
        """
        Get a list of users that the request_user can assign permits to,
        based on role hierarchy.
        
        Returns a list of User objects that match the user's assignable roles.
        """
        from django.contrib.auth.models import User as DjangoUser
        import logging
        logger = logging.getLogger(__name__)
        
        current_user_role = get_user_role(request_user)
        logger.info(f"Getting assignable users for {request_user.username} with role: {current_user_role}")
        
        # Define which roles can be assigned by each role
        assignable_by_role = {
            'admin': ['admin', 'senior_clerk', 'junior_clerk', 'assistant'],
            'senior_clerk': ['senior_clerk', 'junior_clerk', 'assistant'],
            'assistant': ['assistant', 'senior_clerk', 'junior_clerk'],
            'junior_clerk': ['senior_clerk'],
            'end_user': [],
            'operator': [],
            'supervisor': [],
        }
        
        allowed_roles = assignable_by_role.get(current_user_role, [])
        logger.info(f"Allowed roles for {current_user_role}: {allowed_roles}")
        
        if not allowed_roles:
            logger.info(f"No allowed roles for {current_user_role}, returning empty list")
            return []
        
        # Get users with allowed roles
        try:
            from .models import UserRole, Role
            
            # First, get all roles with names matching allowed_roles
            roles = Role.objects.filter(name__in=allowed_roles, is_active=True)
            logger.info(f"Found roles: {[r.name for r in roles]}")
            
            # Then get users with those roles
            users = DjangoUser.objects.filter(
                user_role__role__in=roles,
                user_role__is_active=True
            ).distinct()
            
            logger.info(f"Found {users.count()} assignable users: {[u.username for u in users]}")
            return users
        except Exception as e:
            logger.error(f"Error getting assignable users: {e}", exc_info=True)
            return []
    
    def get_permissions(self):
        """
        Return the list of permissions that this view requires.
        """
        if self.action == 'create':
            # Users with permit_create feature can create permits
            permission_classes = [IsAuthenticated, CanCreatePermit]
        elif self.action in ['update', 'partial_update']:
            # Users with permit_edit feature can update permits, plus assignment hierarchy check
            permission_classes = [IsAuthenticated, CanUpdatePermit, CanAssignPermit]
        elif self.action == 'destroy':
            # Only admin can delete
            permission_classes = [IsAdminUser, CanDeletePermit]
        elif self.action == 'public_search':
            # Public search - no authentication required
            permission_classes = [AllowAny]
        elif self.action in ['list', 'retrieve']:
            # Anyone can view (but will be protected by middleware)
            permission_classes = [IsAuthenticated]
        else:
            # All other actions require authentication
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create a new permit and automatically set created_by to the current user.
        Also automatically assign the permit to an available junior clerk (load balancing).
        """
        # Get the serializer data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set created_by to the current user's username
        serializer.validated_data['created_by'] = request.user.username
        
        # Automatically assign to available junior clerk
        junior_clerk = self.get_available_junior_clerk()
        if junior_clerk:
            serializer.validated_data['assigned_to'] = junior_clerk
            serializer.validated_data['assigned_at'] = timezone.now()
            serializer.validated_data['assigned_by'] = request.user.username
        
        # Perform the creation
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """
        Update a permit with authorization checks.
        End_users can only update permits they created.
        Only Assistants can change the status field.
        Enforces hierarchical assignment rules.
        """
        permit = self.get_object()
        
        # Check if end_user is trying to update a permit they didn't create
        if not request.user.is_staff:
            try:
                user_role = UserRole.objects.filter(
                    user=request.user,
                    is_active=True
                ).first()
                
                if user_role and user_role.role.name == 'end_user':
                    # End_user can only update permits they created
                    if permit.created_by != request.user.username:
                        return Response(
                            {'error': 'You can only update permits you created'},
                            status=status.HTTP_403_FORBIDDEN
                        )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Error checking update permissions: {e}")
        
        # Check if non-assistant/admin is trying to change status
        if request.data.get('status') and request.data.get('status') != permit.status:
            # Allow Django staff (admins) to change status
            if not request.user.is_staff:
                try:
                    user_role = UserRole.objects.filter(
                        user=request.user,
                        is_active=True
                    ).first()
                    
                    # Only assistant or admin role can change status
                    if not user_role or user_role.role.name not in ['assistant', 'admin']:
                        return Response(
                            {'error': 'Only Admins and Assistants can change the permit status'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.debug(f"Error checking status change permissions: {e}")
                    # If we can't verify role, deny status change for non-staff users
                    return Response(
                        {'error': 'Cannot verify permissions for status change'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Check if trying to assign to a user - validate role hierarchy ONLY if assignment is changing
        if request.data.get('assigned_to') is not None:
            assigned_to_id = request.data.get('assigned_to')
            current_assigned_id = permit.assigned_to.id if permit.assigned_to else None
            
            # Only validate if assignment is actually CHANGING
            if assigned_to_id and assigned_to_id != current_assigned_id:  # If trying to assign to someone DIFFERENT
                try:
                    target_user = User.objects.get(id=assigned_to_id)
                    can_assign, message = can_assign_to_user(request.user, target_user, permit)
                    if not can_assign:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Assignment denied for user {request.user.username}: {message}")
                        return Response(
                            {'error': message},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Target user does not exist'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error validating assignment: {e}")
                    return Response(
                        {'error': 'Error validating assignment'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        # Get the serializer data
        serializer = self.get_serializer(permit, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Set updated_by to the current user's username
        serializer.validated_data['updated_by'] = request.user.username
        
        # Update assignment metadata if assigning to someone
        if request.data.get('assigned_to') is not None and request.data.get('assigned_to'):
            serializer.validated_data['assigned_at'] = timezone.now()
            serializer.validated_data['assigned_by'] = request.user.username
        
        # Perform the update
        self.perform_update(serializer)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = Permit.objects.all()
        
        # Filter permits based on user role
        if self.request.user and self.request.user.is_authenticated:
            # Admins can see all permits
            if not self.request.user.is_staff:
                # Check if user has end_user role
                try:
                    from .models import UserRole
                    user_role = UserRole.objects.filter(
                        user=self.request.user,
                        is_active=True
                    ).first()
                    
                    # If end_user, show only permits created by them
                    if user_role and user_role.role.name == 'end_user':
                        queryset = queryset.filter(created_by=self.request.user.username)
                    # For other roles (operator, supervisor), show all permits
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.debug(f"Error filtering permits by role: {e}")
        
        # Filter by status
        query_params = getattr(self.request, 'query_params', {})
        status_param = query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by authority
        authority_param = query_params.get('authority', None)
        if authority_param:
            queryset = queryset.filter(authority=authority_param)
        
        # Filter by permit type
        permit_type_param = query_params.get('permit_type', None)
        if permit_type_param:
            queryset = queryset.filter(permit_type=permit_type_param)
        
        # Filter by date range
        from_date = self.request.query_params.get('from_date', None)
        to_date = self.request.query_params.get('to_date', None)
        if from_date:
            queryset = queryset.filter(valid_from__gte=from_date)
        if to_date:
            queryset = queryset.filter(valid_to__lte=to_date)
        
        # Filter by assigned_to user
        assigned_to_param = query_params.get('assigned_to', None)
        if assigned_to_param:
            try:
                assigned_to_id = int(assigned_to_param)
                queryset = queryset.filter(assigned_to__id=assigned_to_id)
            except (ValueError, TypeError):
                pass
        
        # Filter for unassigned permits
        assigned_to_isnull = query_params.get('assigned_to__isnull', None)
        if assigned_to_isnull and assigned_to_isnull.lower() == 'true':
            queryset = queryset.filter(assigned_to__isnull=True)
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get permit statistics (respects role-based filtering)"""
        # Use get_queryset() to respect role-based filtering
        queryset = self.get_queryset()
        
        total = queryset.count()
        active = queryset.filter(status='active').count()
        inactive = queryset.filter(status='inactive').count()
        cancelled = queryset.filter(status='cancelled').count()
        expired = queryset.filter(status='expired').count()
        pending = queryset.filter(status='pending').count()
        
        stats_data = {
            'totalPermits': total,
            'activePermits': active,
            'inactivePermits': inactive,
            'cancelledPermits': cancelled,
            'expiredPermits': expired,
            'pendingPermits': pending,
        }
        
        serializer = PermitStatsSerializer(stats_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_search(self, request):
        """
        Public search endpoint for permits by vehicle number or CNIC.
        No authentication required.
        
        Query parameters:
        - vehicle_number: Search by vehicle/car number (e.g., ABC-123)
        - cnic: Search by owner CNIC (e.g., 12345-1234567-1)
        
        Returns full permit details including expiry information.
        """
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 PUBLIC_SEARCH called | Path: {request.path} | Query: {request.query_params} | Full GET: {request.GET}")
        logger.info(f"   Client IP: {self.get_client_ip_debug(request)}")
        
        vehicle_number = request.query_params.get('vehicle_number', None)
        cnic = request.query_params.get('cnic', None)
        
        logger.info(f"   vehicle_number={vehicle_number}, cnic={cnic}")
        
        # Validate that at least one search parameter is provided
        if not vehicle_number and not cnic:
            logger.warning(f"❌ PUBLIC_SEARCH: Missing required parameters")
            return Response(
                {'error': 'Please provide either vehicle_number or cnic parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build query
        query = Q()
        search_by = []
        
        if vehicle_number:
            # Case-insensitive search for vehicle number
            query |= Q(vehicle_number__icontains=vehicle_number)
            search_by.append(f'vehicle_number: {vehicle_number}')
        
        if cnic:
            # Case-insensitive search for CNIC
            query |= Q(owner_cnic__icontains=cnic)
            search_by.append(f'cnic: {cnic}')
        
        # Execute query
        permits = Permit.objects.filter(query).select_related(
            'permit_type', 'vehicle_type'
        ).order_by('-valid_to')
        
        if not permits.exists():
            return Response(
                {
                    'count': 0,
                    'results': [],
                    'message': f'No permits found matching: {", ".join(search_by)}'
                }
            )
        
        serializer = PermitSerializer(permits, many=True, context={'request': request})
        return Response({
            'count': permits.count(),
            'results': serializer.data,
            'search_criteria': search_by
        })

    @action(detail=False, methods=['get'])
    def eligible_users(self, request):
        """
        Get list of users that the current user can assign permits to,
        based on role hierarchy (same as assignable_users endpoint).
        This endpoint is used by PermitEdit page.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Use the same logic as assignable_users
        assignable_users_list = self.get_assignable_users(request.user)
        current_user_role = get_user_role(request.user)
        
        logger.info(f"eligible_users endpoint - Role '{current_user_role}' has {len(assignable_users_list)} assignable users")
        
        from .models import UserRole
        users_data = []
        
        for user in assignable_users_list:
            try:
                user_role = UserRole.objects.filter(user=user, is_active=True).first()
                role_name = user_role.role.name if user_role and user_role.role else 'unknown'
                
                user_info = {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': role_name,
                    'full_name': user.get_full_name() or user.username
                }
                users_data.append(user_info)
                logger.debug(f"Added user {user.username} with role {role_name}")
            except Exception as e:
                logger.error(f"Error getting user info for {user.username}: {e}", exc_info=True)
                continue
        
        logger.info(f"eligible_users endpoint - Final response: {len(users_data)} users")
        return Response(users_data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a permit"""
        permit = self.get_object()
        changes = permit.cancel()
        
        # Record in history with detailed changes
        PermitHistory.objects.create(
            permit=permit,
            action='cancelled',
            performed_by=str(request.user) if request.user.is_authenticated else 'System',
            changes=changes,
            notes=request.data.get('notes', '')
        )
        
        return Response(
            {'detail': 'Permit cancelled successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a permit"""
        permit = self.get_object()
        changes = permit.activate()
        
        PermitHistory.objects.create(
            permit=permit,
            action='activated',
            performed_by=str(request.user) if request.user.is_authenticated else 'System',
            changes=changes,
            notes=request.data.get('notes', '')
        )
        
        return Response(
            {'detail': 'Permit activated successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a permit"""
        permit = self.get_object()
        changes = permit.deactivate()
        
        PermitHistory.objects.create(
            permit=permit,
            action='deactivated',
            performed_by=str(request.user) if request.user.is_authenticated else 'System',
            changes=changes,
            notes=request.data.get('notes', '')
        )
        
        return Response(
            {'detail': 'Permit deactivated successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Renew a permit"""
        from datetime import datetime
        
        permit = self.get_object()
        new_valid_to = request.data.get('new_valid_to')
        
        if not new_valid_to:
            return Response(
                {'error': 'new_valid_to date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert string date to date object if needed
        if isinstance(new_valid_to, str):
            new_valid_to = datetime.strptime(new_valid_to, '%Y-%m-%d').date()
        
        changes = permit.renew(new_valid_to)
        
        PermitHistory.objects.create(
            permit=permit,
            action='renewed',
            performed_by=str(request.user) if request.user.is_authenticated else 'System',
            changes=changes,
            notes=f'Renewed until {new_valid_to}'
        )
        
        serializer = self.get_serializer(permit)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reapply_for_expired(self, request, pk=None):
        """
        Reapply for an expired permit.
        Creates a new permit with the same details but with new dates,
        and stores a reference to the expired permit.
        
        Request data:
        - valid_from: New start date (optional, defaults to today)
        - valid_to: New end date (required)
        
        Returns the newly created permit with reference to the old permit.
        """
        from datetime import datetime
        
        expired_permit = self.get_object()
        
        # Verify the permit is actually expired
        if expired_permit.status != 'expired':
            return Response(
                {'error': 'Only expired permits can be reapplied for. This permit is not expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there are any other ACTIVE or APPROVED permits with the same vehicle number
        # NOTE: We exclude 'pending' status because pending permits are not yet active
        from django.utils import timezone as tz
        today = tz.now().date()
        
        other_active_permits = Permit.objects.filter(
            vehicle_number=expired_permit.vehicle_number,
            status__in=['active', 'approved']
        ).exclude(id=expired_permit.id)
        
        # Check if any of these permits are not yet expired
        for permit in other_active_permits:
            if permit.valid_to >= today:
                return Response(
                    {
                        'error': f'Cannot reapply. An active permit already exists for vehicle {expired_permit.vehicle_number}. '
                                 f'Permit Number: {permit.permit_number}, Valid until: {permit.valid_to}. '
                                 f'You can only reapply after this permit expires.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get new dates from request
        new_valid_from = request.data.get('valid_from', timezone.now().date())
        new_valid_to = request.data.get('valid_to')
        
        if not new_valid_to:
            return Response(
                {'error': 'valid_to date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convert string dates to date objects if needed
            if isinstance(new_valid_from, str):
                new_valid_from = datetime.strptime(new_valid_from, '%Y-%m-%d').date()
            if isinstance(new_valid_to, str):
                new_valid_to = datetime.strptime(new_valid_to, '%Y-%m-%d').date()
            
            # Create a new permit with the same details as the expired permit
            new_permit_data = {
                'authority': expired_permit.authority,
                'permit_type': expired_permit.permit_type,
                'vehicle_number': expired_permit.vehicle_number,
                'vehicle_type': expired_permit.vehicle_type,
                'vehicle_make': expired_permit.vehicle_make,
                'vehicle_model': expired_permit.vehicle_model,
                'vehicle_year': expired_permit.vehicle_year,
                'vehicle_capacity': expired_permit.vehicle_capacity,
                'owner_name': expired_permit.owner_name,
                'owner_email': expired_permit.owner_email,
                'owner_phone': expired_permit.owner_phone,
                'owner_address': expired_permit.owner_address,
                'owner_cnic': expired_permit.owner_cnic,
                'valid_from': new_valid_from,
                'valid_to': new_valid_to,
                'status': 'pending',
                'description': expired_permit.description,
                'remarks': f'Reapplication for expired permit: {expired_permit.permit_number}',
                'approved_routes': expired_permit.approved_routes,
                'restrictions': expired_permit.restrictions,
                'created_by': request.user.username if request.user.is_authenticated else 'System',
            }
            
            # Get the ID of the expired permit to track in the new permit
            expired_permit_id = expired_permit.id
            
            # Get any existing previous permits from the expired permit
            previous_permits_ids = expired_permit.previous_permits_ids or []
            
            # Add the expired permit to the chain (if not already there)
            if expired_permit_id not in previous_permits_ids:
                previous_permits_ids.append(expired_permit_id)
            
            new_permit_data['previous_permits_ids'] = previous_permits_ids
            
            # Generate permit number for the new permit
            import uuid
            permit_type = expired_permit.permit_type
            permit_type_code = permit_type.code if permit_type else 'GEN'
            permit_number = f"{new_permit_data['authority']}-{permit_type_code}-{uuid.uuid4().hex[:8].upper()}"
            new_permit_data['permit_number'] = permit_number
            
            # Create the new permit
            new_permit = Permit.objects.create(**new_permit_data)
            
            # Automatically assign to available junior clerk
            junior_clerk = self.get_available_junior_clerk()
            if junior_clerk:
                new_permit.assigned_to = junior_clerk
                new_permit.assigned_at = timezone.now()
                new_permit.assigned_by = request.user.username if request.user.is_authenticated else 'System'
                new_permit.save(update_fields=['assigned_to', 'assigned_at', 'assigned_by'])
            
            # Record in history for both permits
            PermitHistory.objects.create(
                permit=new_permit,
                action='created',
                performed_by=str(request.user) if request.user.is_authenticated else 'System',
                changes={'previous_permit_id': expired_permit_id},
                notes=f'Reapplication for expired permit: {expired_permit.permit_number}'
            )
            
            PermitHistory.objects.create(
                permit=expired_permit,
                action='renewed',
                performed_by=str(request.user) if request.user.is_authenticated else 'System',
                changes={'new_permit_id': new_permit.id},
                notes=f'Expired permit reapplied. New permit: {new_permit.permit_number}'
            )
            
            serializer = self.get_serializer(new_permit)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in reapply_for_expired: {e}")
            return Response(
                {'error': f'Failed to create new permit: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def assignable_users(self, request):
        """
        Get a list of users that the current user can assign permits to,
        based on role hierarchy.
        
        Returns list of users with their basic info (id, username, email, role).
        
        Usage: GET /permits/assignable_users/
        """
        import logging
        logger = logging.getLogger(__name__)
        
        assignable_users_list = self.get_assignable_users(request.user)
        current_user_role = get_user_role(request.user)
        
        logger.info(f"endpoint - Assignable users count for role '{current_user_role}': {len(assignable_users_list)}")
        
        users_data = []
        for user in assignable_users_list:
            try:
                from .models import UserRole
                user_role = UserRole.objects.filter(user=user, is_active=True).first()
                role_name = user_role.role.name if user_role and user_role.role else 'unknown'
                
                user_info = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': role_name,
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                }
                users_data.append(user_info)
                logger.debug(f"Added user {user.username} with role {role_name}")
            except Exception as e:
                logger.error(f"Error getting user info for {user.username}: {e}", exc_info=True)
                continue
        
        logger.info(f"Final response - {len(users_data)} users returned: {[u['username'] for u in users_data]}")
        
        return Response({
            'count': len(users_data),
            'results': users_data,
            'current_user_role': current_user_role,
        })

    @action(detail=False, methods=['get'])
    def all_employees(self, request):
        """
        Get a list of ALL active employees in the system.
        This endpoint returns all active users regardless of role hierarchy.
        
        Used by: PermitList filter dropdown to show all employees
        
        Returns list of users with their basic info (id, username, email, role, full_name).
        
        Usage: GET /permits/all-employees/
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Get all active users
            all_users = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
            
            logger.info(f"all_employees endpoint - Found {all_users.count()} active users")
            
            users_data = []
            for user in all_users:
                try:
                    from .models import UserRole
                    user_role = UserRole.objects.filter(user=user, is_active=True).first()
                    role_name = user_role.role.name if user_role and user_role.role else 'unknown'
                    
                    user_info = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': role_name,
                        'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    }
                    users_data.append(user_info)
                    logger.debug(f"Added user {user.username} with role {role_name}")
                except Exception as e:
                    logger.error(f"Error getting user info for {user.username}: {e}", exc_info=True)
                    continue
            
            logger.info(f"all_employees endpoint - Final response: {len(users_data)} users")
            
            return Response({
                'count': len(users_data),
                'results': users_data,
            })
        except Exception as e:
            logger.error(f"Error in all_employees endpoint: {e}", exc_info=True)
            return Response({
                'error': str(e),
                'count': 0,
                'results': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def role_assignment_hierarchy(self, request):
        """
        Get the role assignment hierarchy information.
        Shows which roles can assign to which other roles.
        
        Useful for frontend to display available assignees based on user's role.
        """
        hierarchy = {
            'admin': {
                'display_name': 'Administrator',
                'can_assign_to': ['admin', 'senior_clerk', 'junior_clerk', 'assistant'],
                'description': 'Can assign permits to any role'
            },
            'senior_clerk': {
                'display_name': 'Senior Clerk',
                'can_assign_to': ['senior_clerk', 'junior_clerk', 'assistant'],
                'description': 'Can assign permits to Junior Clerks and Assistants'
            },
            'assistant': {
                'display_name': 'Assistant',
                'can_assign_to': ['assistant', 'senior_clerk', 'junior_clerk'],
                'description': 'Can assign permits to Senior Clerks and Junior Clerks'
            },
            'junior_clerk': {
                'display_name': 'Junior Clerk',
                'can_assign_to': ['senior_clerk'],
                'description': 'Can assign permits to Senior Clerks only'
            },
            'end_user': {
                'display_name': 'End User',
                'can_assign_to': [],
                'description': 'Cannot assign permits'
            },
            'operator': {
                'display_name': 'Operator',
                'can_assign_to': [],
                'description': 'Cannot assign permits'
            },
            'supervisor': {
                'display_name': 'Supervisor',
                'can_assign_to': [],
                'description': 'Cannot assign permits'
            },
        }
        
        current_user_role = get_user_role(request.user)
        return Response({
            'hierarchy': hierarchy,
            'current_user_role': current_user_role,
            'current_user_can_assign_to': hierarchy.get(current_user_role, {}).get('can_assign_to', []),
        })

    @action(detail=False, methods=['get'])
    def check_vehicle_number(self, request):
        """
        Check vehicle number availability and get existing permit information.
        
        Query Parameters:
        - vehicle_number: The vehicle number to check (required)
        - exclude_permit_id: Permit ID to exclude from the check (when editing)
        
        Returns:
        {
            'available': bool,
            'message': str,
            'existing_permits': [
                {
                    'id': int,
                    'permit_number': str,
                    'status': str,
                    'valid_to': date,
                    'is_active': bool,
                }
            ]
        }
        """
        vehicle_number = request.query_params.get('vehicle_number', '').strip()
        exclude_permit_id = request.query_params.get('exclude_permit_id')
        
        if not vehicle_number:
            return Response(
                {'error': 'vehicle_number parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Query existing permits with this vehicle number
        query = Permit.objects.filter(vehicle_number__iexact=vehicle_number)
        
        # Exclude the current permit if editing
        if exclude_permit_id:
            try:
                query = query.exclude(id=int(exclude_permit_id))
            except (ValueError, TypeError):
                pass
        
        existing_permits = query.order_by('-issued_date').values(
            'id', 'permit_number', 'status', 'valid_from', 'valid_to', 'issued_date'
        )
        
        # Check if there are any active or pending permits
        active_permits = [p for p in existing_permits if p['status'] in ['active', 'pending']]
        # Check for expired permits based on valid_to date being in the past
        today = timezone.now().date()
        expired_permits = [p for p in existing_permits if p['valid_to'] < today]
        
        if active_permits:
            message = f"⚠️ Vehicle number '{vehicle_number}' is already registered with an ACTIVE permit ({active_permits[0]['permit_number']}). You can only create a new permit if the existing one expires."
            available = False
        elif expired_permits:
            message = f"✓ Vehicle number '{vehicle_number}' has expired permit(s). You can create a renewal permit."
            available = True
        else:
            message = f"✓ Vehicle number '{vehicle_number}' is available."
            available = True
        
        return Response({
            'vehicle_number': vehicle_number,
            'available': available,
            'message': message,
            'active_permits_count': len(active_permits),
            'expired_permits_count': len(expired_permits),
            'total_permits_count': len(list(existing_permits)),
            'existing_permits': list(existing_permits),
        })

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get permits expiring in next 30 days"""
        today = timezone.now().date()
        from datetime import timedelta
        thirty_days = today + timedelta(days=30)
        
        expiring = Permit.objects.filter(
            valid_to__lte=thirty_days,
            valid_to__gte=today,
            status='active'
        )
        
        serializer = self.get_serializer(expiring, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Create new permit and record in history"""
        permit = serializer.save()
        
        PermitHistory.objects.create(
            permit=permit,
            action='created',
            performed_by=str(self.request.user) if self.request.user.is_authenticated else 'System',
            notes='Permit created'
        )

    def perform_update(self, serializer):
        """Update permit and record in history with field changes"""
        # Get old values before update
        permit = serializer.instance
        old_assigned_to = permit.assigned_to_id
        old_status = permit.status
        
        old_data = {
            'authority': permit.authority,
            'permit_type': permit.permit_type,
            'vehicle_number': permit.vehicle_number,
            'vehicle_make': permit.vehicle_make,
            'vehicle_model': permit.vehicle_model,
            'vehicle_year': permit.vehicle_year,
            'vehicle_capacity': permit.vehicle_capacity,
            'owner_name': permit.owner_name,
            'owner_email': permit.owner_email,
            'owner_phone': permit.owner_phone,
            'owner_address': permit.owner_address,
            'owner_cnic': permit.owner_cnic,
            'status': permit.status,
            'valid_from': str(permit.valid_from),
            'valid_to': str(permit.valid_to),
            'description': permit.description,
            'remarks': permit.remarks,
            'approved_routes': permit.approved_routes,
            'restrictions': permit.restrictions,
            'assigned_to': str(permit.assigned_to.username) if permit.assigned_to else None,
        }
        
        # Track which fields are being updated
        update_fields = []
        
        # Check if assigned_to is being changed
        new_assigned_to = serializer.validated_data.get('assigned_to')
        if new_assigned_to != old_assigned_to:
            # Set assignment metadata
            serializer.validated_data['assigned_at'] = timezone.now()
            serializer.validated_data['assigned_by'] = str(self.request.user) if self.request.user.is_authenticated else 'System'
            update_fields.append('assigned_to')
            update_fields.append('assigned_at')
            update_fields.append('assigned_by')
        
        # Collect all fields being updated
        for field_name in serializer.validated_data.keys():
            if field_name not in update_fields:
                update_fields.append(field_name)
        
        # Always track the update time and user
        serializer.validated_data['updated_by'] = str(self.request.user) if self.request.user.is_authenticated else 'System'
        serializer.validated_data['last_modified'] = timezone.now()
        update_fields.extend(['updated_by', 'last_modified'])
        
        # Save with explicit update_fields so signals get notified
        updated_permit = serializer.save()
        updated_permit.save(update_fields=update_fields)
        
        # Track changed fields
        new_data = {
            'authority': updated_permit.authority,
            'permit_type': updated_permit.permit_type,
            'vehicle_number': updated_permit.vehicle_number,
            'vehicle_make': updated_permit.vehicle_make,
            'vehicle_model': updated_permit.vehicle_model,
            'vehicle_year': updated_permit.vehicle_year,
            'vehicle_capacity': updated_permit.vehicle_capacity,
            'owner_name': updated_permit.owner_name,
            'owner_email': updated_permit.owner_email,
            'owner_phone': updated_permit.owner_phone,
            'owner_address': updated_permit.owner_address,
            'owner_cnic': updated_permit.owner_cnic,
            'status': updated_permit.status,
            'valid_from': str(updated_permit.valid_from),
            'valid_to': str(updated_permit.valid_to),
            'description': updated_permit.description,
            'remarks': updated_permit.remarks,
            'approved_routes': updated_permit.approved_routes,
            'restrictions': updated_permit.restrictions,
            'assigned_to': str(updated_permit.assigned_to.username) if updated_permit.assigned_to else None,
        }
        
        # Build changes dictionary with only modified fields
        changes = {}
        for field, old_value in old_data.items():
            if old_value != new_data[field]:
                changes[field] = {
                    'old': old_value,
                    'new': new_data[field]
                }
        
        # Record in history with detailed changes
        PermitHistory.objects.create(
            permit=updated_permit,
            action='updated',
            performed_by=str(self.request.user) if self.request.user.is_authenticated else 'System',
            changes=changes,
            notes=f'Updated {len(changes)} field(s)' if changes else 'No changes made'
        )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get complete history of changes for a single permit"""
        permit = self.get_object()
        history = permit.history.all()
        serializer = PermitHistorySerializer(history, many=True)
        return Response({
            'permit_number': permit.permit_number,
            'vehicle_number': permit.vehicle_number,
            'total_changes': history.count(),
            'history': serializer.data
        })

    @action(detail=False, methods=['get'])
    def report_history(self, request):
        """Get permit history report with filters"""
        permit_id = request.query_params.get('permit_id')
        status_filter = request.query_params.get('status')
        action_filter = request.query_params.get('action')
        days = request.query_params.get('days', 30)
        
        history_query = PermitHistory.objects.all()
        
        if permit_id:
            history_query = history_query.filter(permit_id=permit_id)
        
        if status_filter:
            history_query = history_query.filter(permit__status=status_filter)
        
        if action_filter:
            history_query = history_query.filter(action=action_filter)
        
        # Filter by days
        try:
            days = int(days)
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=days)
            history_query = history_query.filter(timestamp__gte=cutoff_date)
        except (ValueError, TypeError):
            pass
        
        serializer = PermitHistorySerializer(history_query, many=True)
        return Response({
            'total_records': history_query.count(),
            'filters': {
                'permit_id': permit_id,
                'status': status_filter,
                'action': action_filter,
                'days': days
            },
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def report_permits_by_type(self, request):
        """Generate report of permits grouped by type (respects role-based filtering)"""
        from django.db.models import Count, Q
        
        # Get the filtered queryset based on user role
        base_queryset = self.get_queryset()
        
        report_data = []
        permit_types = PermitType.objects.all()
        
        for ptype in permit_types:
            permits = base_queryset.filter(permit_type=ptype)
            status_breakdown = {}
            
            for status_choice, status_display in Permit.STATUS_CHOICES:
                count = permits.filter(status=status_choice).count()
                status_breakdown[status_choice] = count
            
            report_data.append({
                'permit_type': ptype.name,
                'permit_code': ptype.code,
                'total': permits.count(),
                'status_breakdown': status_breakdown,
                'active': permits.filter(status='active').count(),
                'expired': permits.filter(status='expired').count(),
                'cancelled': permits.filter(status='cancelled').count(),
                'pending': permits.filter(status='pending').count(),
                'inactive': permits.filter(status='inactive').count(),
            })
        
        return Response({
            'report_type': 'Permits by Type',
            'generated_at': timezone.now(),
            'data': report_data
        })

    @action(detail=False, methods=['get'])
    def report_permits_by_vehicle(self, request):
        """Generate report of permits grouped by vehicle type (respects role-based filtering)"""
        # Get the filtered queryset based on user role
        base_queryset = self.get_queryset()
        
        report_data = []
        vehicle_types = VehicleType.objects.filter(is_active=True)
        
        for vtype in vehicle_types:
            permits = base_queryset.filter(vehicle_type=vtype)
            status_breakdown = {}
            
            for status_choice, status_display in Permit.STATUS_CHOICES:
                count = permits.filter(status=status_choice).count()
                status_breakdown[status_choice] = count
            
            report_data.append({
                'vehicle_type': vtype.name,
                'total': permits.count(),
                'status_breakdown': status_breakdown,
                'active': permits.filter(status='active').count(),
                'expired': permits.filter(status='expired').count(),
            })
        
        return Response({
            'report_type': 'Permits by Vehicle Type',
            'generated_at': timezone.now(),
            'data': report_data
        })

    @action(detail=False, methods=['get'])
    def report_authority_summary(self, request):
        """Generate authority-wise summary report (respects role-based filtering)"""
        # Get the filtered queryset based on user role
        base_queryset = self.get_queryset()
        
        report_data = []
        
        for authority_choice, authority_display in Permit.AUTHORITY_CHOICES:
            permits = base_queryset.filter(authority=authority_choice)
            
            report_data.append({
                'authority': authority_display,
                'authority_code': authority_choice,
                'total_permits': permits.count(),
                'active': permits.filter(status='active').count(),
                'inactive': permits.filter(status='inactive').count(),
                'cancelled': permits.filter(status='cancelled').count(),
                'expired': permits.filter(status='expired').count(),
                'pending': permits.filter(status='pending').count(),
            })
        
        return Response({
            'report_type': 'Authority Summary',
            'generated_at': timezone.now(),
            'data': report_data
        })

    @action(detail=False, methods=['get'])
    def report_expiring_permits(self, request):
        """Generate report of permits expiring soon"""
        days = request.query_params.get('days', 30)
        
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 30
        
        from datetime import timedelta
        today = timezone.now().date()
        expiring_date = today + timedelta(days=days)
        
        permits = Permit.objects.filter(
            valid_to__lte=expiring_date,
            valid_to__gte=today,
            status='active'
        ).order_by('valid_to')
        
        from .serializers import PermitSerializer
        serializer = PermitSerializer(permits, many=True)
        
        return Response({
            'report_type': f'Permits Expiring Within {days} Days',
            'generated_at': timezone.now(),
            'expiring_date': expiring_date,
            'total_expiring': permits.count(),
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def report_owner_permits(self, request):
        """Generate report of permits for a specific owner"""
        owner_email = request.query_params.get('email')
        owner_name = request.query_params.get('name')
        owner_phone = request.query_params.get('phone')
        
        query = Permit.objects.all()
        
        if owner_email:
            query = query.filter(owner_email__icontains=owner_email)
        
        if owner_name:
            query = query.filter(owner_name__icontains=owner_name)
        
        if owner_phone:
            query = query.filter(owner_phone__icontains=owner_phone)
        
        from .serializers import PermitSerializer
        serializer = PermitSerializer(query, many=True)
        
        return Response({
            'report_type': 'Owner Permits Report',
            'generated_at': timezone.now(),
            'filters': {
                'email': owner_email,
                'name': owner_name,
                'phone': owner_phone
            },
            'total_permits': query.count(),
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def report_detailed_stats(self, request):
        """Generate comprehensive statistics report"""
        today = timezone.now().date()
        
        from datetime import timedelta
        thirty_days_ago = today - timedelta(days=30)
        thirty_days_ahead = today + timedelta(days=30)
        
        # Overall stats
        total_permits = Permit.objects.count()
        active_permits = Permit.objects.filter(status='active').count()
        # Count expired as permits where valid_to date has passed, regardless of status field
        expired_permits = Permit.objects.filter(valid_to__lt=today).count()
        cancelled_permits = Permit.objects.filter(status='cancelled').count()
        pending_permits = Permit.objects.filter(status='pending').count()
        
        # Recent activity
        recently_created = Permit.objects.filter(issued_date__gte=thirty_days_ago).count()
        recently_modified = Permit.objects.filter(last_modified__gte=thirty_days_ago).count()
        
        # Expiring soon
        expiring_soon = Permit.objects.filter(
            valid_to__lte=thirty_days_ahead,
            valid_to__gte=today,
            status='active'
        ).count()
        
        # By authority
        pta_permits = Permit.objects.filter(authority='PTA').count()
        rta_permits = Permit.objects.filter(authority='RTA').count()
        
        # Permit type breakdown
        permit_type_breakdown = {}
        for ptype in PermitType.objects.all():
            permit_type_breakdown[ptype.name] = Permit.objects.filter(permit_type=ptype).count()
        
        # Vehicle type breakdown
        vehicle_type_breakdown = {}
        for vtype in VehicleType.objects.filter(is_active=True):
            vehicle_type_breakdown[vtype.name] = Permit.objects.filter(vehicle_type=vtype).count()
        
        return Response({
            'report_type': 'Detailed Statistics',
            'generated_at': timezone.now(),
            'overall_stats': {
                'total_permits': total_permits,
                'active_permits': active_permits,
                'expired_permits': expired_permits,
                'cancelled_permits': cancelled_permits,
                'pending_permits': pending_permits,
                'inactive_permits': Permit.objects.filter(status='inactive').count(),
            },
            'recent_activity': {
                'created_last_30_days': recently_created,
                'modified_last_30_days': recently_modified,
                'expiring_in_30_days': expiring_soon,
            },
            'by_authority': {
                'PTA': pta_permits,
                'RTA': rta_permits,
            },
            'by_permit_type': permit_type_breakdown,
            'by_vehicle_type': vehicle_type_breakdown,
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def save_draft(self, request):
        """
        Save permit form as draft for later completion
        POST /api/permits/save_draft/
        
        Request data:
        - All permit fields (optional, can be partial)
        - draft_name: optional name for this draft
        
        Returns the created/updated draft permit
        """
        try:
            draft_data = request.data.copy()
            draft_name = draft_data.pop('draft_name', None)
            
            # Map frontend field names to backend model field names
            if 'permit_type_id' in draft_data and draft_data['permit_type_id']:
                draft_data['permit_type'] = draft_data.pop('permit_type_id')
            elif 'permit_type_write' in draft_data:
                draft_data['permit_type'] = draft_data.pop('permit_type_write')
            else:
                draft_data.pop('permit_type_write', None)
                draft_data.pop('permit_type_id', None)
            
            if 'vehicle_type_id' in draft_data and draft_data['vehicle_type_id']:
                draft_data['vehicle_type'] = draft_data.pop('vehicle_type_id')
            elif 'vehicle_type_write' in draft_data:
                draft_data['vehicle_type'] = draft_data.pop('vehicle_type_write')
            else:
                draft_data.pop('vehicle_type_write', None)
                draft_data.pop('vehicle_type_id', None)
            
            # Set draft status and owner
            draft_data['status'] = 'draft'
            draft_data['user_owner'] = request.user.id
            
            # Ensure authority is set
            if 'authority' not in draft_data or not draft_data['authority']:
                draft_data['authority'] = 'RTA'
            
            # Check if updating existing draft or creating new
            draft_id = draft_data.pop('id', None)
            
            # Remove read-only fields
            draft_data.pop('permit_number', None)
            draft_data.pop('issued_date', None)
            draft_data.pop('last_modified', None)
            
            if draft_id:
                # Update existing draft
                draft = Permit.objects.get(id=draft_id, status='draft', user_owner=request.user)
                serializer = self.get_serializer(draft, data=draft_data, partial=True)
            else:
                # Create new draft
                serializer = self.get_serializer(data=draft_data, partial=True)
            
            if serializer.is_valid():
                permit = serializer.save()
                permit.user_owner = request.user
                permit.status = 'draft'
                permit.save()
                
                return Response({
                    'status': 'success',
                    'message': 'Permit draft saved successfully',
                    'draft': self.get_serializer(permit).data
                }, status=status.HTTP_201_CREATED)
            else:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Serializer errors: {serializer.errors}")
                return Response({
                    'status': 'error',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Permit.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Draft not found or does not belong to you'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error saving draft: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': f'Failed to save draft: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_drafts(self, request):
        """
        List all draft permits for current user
        GET /api/permits/my_drafts/
        
        Returns list of draft permits created by the current user
        """
        try:
            drafts = Permit.objects.filter(
                status='draft',
                user_owner=request.user
            ).order_by('-last_modified')
            
            serializer = self.get_serializer(drafts, many=True)
            return Response({
                'status': 'success',
                'count': drafts.count(),
                'drafts': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error retrieving drafts: {e}")
            return Response({
                'status': 'error',
                'message': f'Failed to retrieve drafts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit_draft(self, request, pk=None):
        """
        Submit a draft permit for processing
        POST /api/permits/{id}/submit_draft/
        
        Converts draft to pending/active status and generates permit number
        """
        try:
            permit = self.get_object()
            
            # Verify it's a draft owned by the user
            if permit.status != 'draft':
                return Response({
                    'status': 'error',
                    'message': 'Only draft permits can be submitted'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if permit.user_owner != request.user:
                return Response({
                    'status': 'error',
                    'message': 'You do not have permission to submit this draft'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Validate required fields before submission
            required_fields = ['vehicle_number', 'owner_name', 'owner_phone', 'permit_type', 'valid_from', 'valid_to']
            missing_fields = [field for field in required_fields if not getattr(permit, field, None)]
            
            if missing_fields:
                return Response({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}. Please complete the form before submitting.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate permit number
            import uuid
            permit_type = permit.permit_type
            permit_type_code = permit_type.code if permit_type else 'GEN'
            permit_number = f"{permit.authority}-{permit_type_code}-{uuid.uuid4().hex[:8].upper()}"
            
            # Update permit status
            permit.permit_number = permit_number
            permit.status = 'pending'
            permit.created_by = request.user.username if request.user.is_authenticated else 'System'
            permit.save()
            
            # Record history
            PermitHistory.objects.create(
                permit=permit,
                action='submitted',
                performed_by=str(request.user),
                notes='Draft permit submitted for processing'
            )
            
            serializer = self.get_serializer(permit)
            return Response({
                'status': 'success',
                'message': f'Draft submitted successfully. Permit number: {permit_number}',
                'permit': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error submitting draft: {e}")
            return Response({
                'status': 'error',
                'message': f'Failed to submit draft: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PermitDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Permit Document uploads and management
    """
    queryset = PermitDocument.objects.all()
    serializer_class = PermitDocumentSerializer
    permission_classes = [IsAuthenticated, CanManagePermitDocument]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['filename', 'document_type', 'permit__permit_number']
    ordering_fields = ['uploaded_at', 'document_type']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        queryset = PermitDocument.objects.all()
        
        # Filter by permit_id
        permit_id = self.request.query_params.get('permit_id', None)
        if permit_id:
            queryset = queryset.filter(permit_id=permit_id)
        
        # Filter by document_type
        doc_type = self.request.query_params.get('document_type', None)
        if doc_type:
            queryset = queryset.filter(document_type=doc_type)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Upload a new document"""
        permit_id = request.data.get('permit')
        
        # Verify permit exists
        try:
            permit = Permit.objects.get(id=permit_id)
        except Permit.DoesNotExist:
            return Response(
                {'error': 'Permit not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is authorized to upload documents for this permit
        # Admins can upload for any permit
        # Permit creator can upload immediately after creation
        # Assigned employees can upload for permits assigned to them
        if not request.user.is_staff:
            # Not an admin - check if user is the creator or assigned to this permit
            is_creator = permit.created_by == request.user.username if hasattr(permit, 'created_by') else False
            is_assigned = permit.assigned_to is not None and permit.assigned_to.id == request.user.id
            
            if not (is_creator or is_assigned):
                return Response(
                    {'detail': 'You do not have permission to upload documents for this permit.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Set uploaded_by
        data = request.data.copy()
        data['uploaded_by'] = str(request.user) if request.user.is_authenticated else 'System'
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Delete a document"""
        document = self.get_object()
        permit = document.permit
        
        # Check if user is authorized to delete documents for this permit
        # Admins can delete any document
        # Assigned employees can only delete documents from permits assigned to them
        if not request.user.is_staff:
            # Not an admin - check if user is assigned to this permit
            if permit.assigned_to is None or permit.assigned_to.id != request.user.id:
                return Response(
                    {'detail': 'You do not have permission to delete documents for this permit.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Proceed with deletion
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document"""
        document = self.get_object()
        document.is_verified = True
        document.verified_by = str(request.user) if request.user.is_authenticated else 'System'
        document.verified_at = timezone.now()
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def delete_by_permit(self, request):
        """Delete all documents for a permit"""
        permit_id = request.query_params.get('permit_id')
        if not permit_id:
            return Response(
                {'error': 'permit_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count, _ = PermitDocument.objects.filter(permit_id=permit_id).delete()
        return Response({'deleted': count})


class PermitTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Permit Type CRUD operations
    """
    queryset = PermitType.objects.all()
    serializer_class = PermitTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Only admin can create/edit/delete permit types"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


class VehicleTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vehicle Type CRUD operations
    """
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Only admin can create/edit/delete vehicle types"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]


# ==================== CHALAN MANAGEMENT VIEWS ====================

from .authentication import CanViewChalan, CanCreateChalan, CanEditChalan, CanManageChalanFees, CanMarkChalanAsPaid, CanCancelChalan
from .serializers import (
    ChalanListSerializer, ChalanDetailSerializer, ChalanCreateSerializer,
    ChalanUpdateSerializer, ChalanPaymentSerializer, ChalanFeeUpdateSerializer,
    ChalanCancelSerializer, ChalanHistorySerializer
)


class ChalanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chalan (Traffic Violation/Penalty) Management
    
    Features:
    - View chalans (with filters and search)
    - Create new chalans
    - Edit chalan details (name, phone, descriptions)
    - Manage chalan fees (permission-based)
    - Mark chalans as paid
    - Cancel chalans
    - Track history of all changes
    """
    queryset = Chalan.objects.all().select_related('user', 'permit', 'issued_by').prefetch_related('history')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['chalan_number', 'owner_name', 'owner_cnic', 'car_number', 'permit__permit_number']
    ordering_fields = ['issued_date', 'fees_amount', 'status', 'owner_name']
    ordering = ['-issued_date']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ChalanCreateSerializer
        elif self.action in ['update', 'partial_update']:
            # Check if it's a fee update
            if 'fees_amount' in self.request.data and len(self.request.data) == 1:
                return ChalanFeeUpdateSerializer
            return ChalanUpdateSerializer
        elif self.action == 'retrieve':
            return ChalanDetailSerializer
        else:  # list
            return ChalanListSerializer
    
    def get_permissions(self):
        """Get appropriate permissions based on action"""
        if self.action == 'list':
            permission_classes = [IsAuthenticated, CanViewChalan]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, CanCreateChalan]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, CanEditChalan]
        elif self.action == 'destroy':
            permission_classes = [IsAdminUser]
        elif self.action == 'retrieve':
            permission_classes = [IsAuthenticated, CanViewChalan]
        elif self.action == 'mark_as_paid':
            permission_classes = [IsAuthenticated, CanMarkChalanAsPaid]
        elif self.action == 'update_fees':
            permission_classes = [IsAuthenticated, CanManageChalanFees]
        elif self.action == 'cancel':
            permission_classes = [IsAuthenticated, CanCancelChalan]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter chalans based on user permissions"""
        queryset = Chalan.objects.all().select_related('user', 'permit', 'issued_by').prefetch_related('history')
        
        # Apply search and filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(chalan_number__icontains=search) |
                Q(owner_name__icontains=search) |
                Q(owner_cnic__icontains=search) |
                Q(car_number__icontains=search)
            )
        
        return queryset.order_by('-issued_date')
    
    def create(self, request, *args, **kwargs):
        """Create a new chalan"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            chalan = serializer.save(issued_by=request.user)
            
            # Log event
            EventLog.objects.create(
                event=Event.objects.filter(code='chalan_create').first() or Event.objects.first(),
                user=request.user,
                content_type='chalan',
                object_id=chalan.id,
                object_description=str(chalan),
                status='success',
                endpoint=request.path,
                request_method='POST'
            )
            
            return Response(
                ChalanDetailSerializer(chalan).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_paid(self, request, pk=None):
        """Mark chalan as paid with payment details"""
        chalan = self.get_object()
        
        # Check permission
        can_mark = CanMarkChalanAsPaid().has_permission(request, self)
        if not can_mark:
            return Response(
                {'error': 'You do not have permission to mark chalans as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChalanPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment_amount = serializer.validated_data.get('payment_amount')
        payment_ref = serializer.validated_data.get('payment_reference', '')
        
        # Validate payment amount
        if payment_amount < chalan.fees_amount:
            return Response(
                {'error': f'Payment amount must be at least {chalan.fees_amount}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as paid
        chalan.mark_as_paid(payment_ref)
        
        # Create history entry
        ChalanHistory.objects.create(
            chalan=chalan,
            action='paid',
            performed_by=request.user.username,
            changes={'paid_amount': {'old': '0', 'new': str(chalan.fees_amount)}},
            notes=f'Payment Reference: {payment_ref}'
        )
        
        # Log event
        EventLog.objects.create(
            event=Event.objects.filter(code='chalan_paid').first() or Event.objects.first(),
            user=request.user,
            content_type='chalan',
            object_id=chalan.id,
            object_description=str(chalan),
            status='success',
            endpoint=request.path,
            request_method='POST'
        )
        
        return Response(
            ChalanDetailSerializer(chalan).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_fees(self, request, pk=None):
        """Update chalan fees (requires special permission)"""
        chalan = self.get_object()
        
        # Check permission
        can_manage = CanManageChalanFees().has_permission(request, self)
        can_manage_obj = CanManageChalanFees().has_object_permission(request, self, chalan)
        
        if not (can_manage and can_manage_obj):
            return Response(
                {'error': 'You do not have permission to manage chalan fees'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChalanFeeUpdateSerializer(chalan, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log event
        EventLog.objects.create(
            event=Event.objects.filter(code='chalan_fee_updated').first() or Event.objects.first(),
            user=request.user,
            content_type='chalan',
            object_id=chalan.id,
            object_description=str(chalan),
            status='success',
            endpoint=request.path,
            request_method='PATCH'
        )
        
        return Response(
            ChalanDetailSerializer(chalan).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel a chalan"""
        chalan = self.get_object()
        
        # Check permission
        can_cancel = CanCancelChalan().has_permission(request, self)
        can_cancel_obj = CanCancelChalan().has_object_permission(request, self, chalan)
        
        if not (can_cancel and can_cancel_obj):
            return Response(
                {'error': 'You do not have permission to cancel this chalan or it is already paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChalanCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')
        
        # Cancel chalan
        old_status = chalan.status
        chalan.status = 'cancelled'
        chalan.updated_by = request.user.username
        chalan.save()
        
        # Create history entry
        ChalanHistory.objects.create(
            chalan=chalan,
            action='cancelled',
            performed_by=request.user.username,
            changes={'status': {'old': old_status, 'new': 'cancelled'}},
            notes=f'Cancellation Reason: {reason}'
        )
        
        # Log event
        EventLog.objects.create(
            event=Event.objects.filter(code='chalan_cancelled').first() or Event.objects.first(),
            user=request.user,
            content_type='chalan',
            object_id=chalan.id,
            object_description=str(chalan),
            status='success',
            endpoint=request.path,
            request_method='POST'
        )
        
        return Response(
            ChalanDetailSerializer(chalan).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statistics(self, request):
        """Get chalan statistics"""
        quarters = Chalan.objects.values('status').annotate(count=Count('id'))
        total_fees = Chalan.objects.aggregate(total=Sum('fees_amount'))
        total_paid = Chalan.objects.aggregate(total=Sum('paid_amount'))
        
        stats = {
            'total_chalans': Chalan.objects.count(),
            'by_status': {item['status']: item['count'] for item in quarters},
            'total_fees_amount': str(total_fees.get('total') or 0),
            'total_paid_amount': str(total_paid.get('total') or 0),
            'pending_collection': str((total_fees.get('total') or 0) - (total_paid.get('total') or 0))
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def history(self, request, pk=None):
        """Get chalan history"""
        chalan = self.get_object()
        history = chalan.history.all()
        serializer = ChalanHistorySerializer(history, many=True)
        return Response(serializer.data)


class VehicleFeeStructureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vehicle fee structures
    Controls the fees for different vehicle types used in chalan management
    """
    queryset = VehicleFeeStructure.objects.all().select_related('vehicle_type', 'updated_by')
    serializer_class = VehicleFeeStructureSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicle_type__name', 'description']
    ordering_fields = ['vehicle_type__name', 'base_fee', 'updated_at']
    ordering = ['vehicle_type__name']
    
    def get_permissions(self):
        """
        Dynamically assign permissions based on action
        """
        if self.action == 'list' or self.action == 'retrieve':
            permission_classes = [IsAuthenticated, HasFeature]
            self.required_feature = 'chalan_vehicle_fee_view'
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, HasFeature]
            self.required_feature = 'chalan_vehicle_fee_manage'
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'create':
            return VehicleFeeStructureCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return VehicleFeeStructureUpdateSerializer
        else:
            return VehicleFeeStructureSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new vehicle fee structure"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if fee structure already exists for this vehicle type
        vehicle_type_id = request.data.get('vehicle_type')
        if VehicleFeeStructure.objects.filter(vehicle_type_id=vehicle_type_id).exists():
            return Response(
                {'error': 'Fee structure already exists for this vehicle type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Save the fee structure with the current user"""
        serializer.save(updated_by=self.request.user)
    
    def perform_update(self, serializer):
        """Update fee structure and track changes"""
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, HasFeature])
    def by_vehicle(self, request):
        """Get fee structure by vehicle type"""
        self.required_feature = 'chalan_vehicle_fee_view'
        vehicle_type_id = request.query_params.get('vehicle_type_id')
        if not vehicle_type_id:
            return Response(
                {'error': 'vehicle_type_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            fee_structure = VehicleFeeStructure.objects.get(vehicle_type_id=vehicle_type_id)
            serializer = self.get_serializer(fee_structure)
            return Response(serializer.data)
        except VehicleFeeStructure.DoesNotExist:
            return Response(
                {'error': 'Fee structure not found for this vehicle type'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, HasFeature])
    def active_only(self, request):
        """Get only active fee structures"""
        self.required_feature = 'chalan_vehicle_fee_view'
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Return notifications for the current user only
        """
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        """
        Get count of unread notifications for the current user
        """
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unread(self, request):
        """
        Get all unread notifications for the current user
        """
        queryset = self.get_queryset().filter(is_read=False)
        serializer = NotificationListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read
        """
        notification = self.get_object()
        
        # Check if user owns this notification
        if notification.user != request.user:
            return Response(
                {'error': 'You can only mark your own notifications as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_unread(self, request, pk=None):
        """
        Mark a notification as unread
        """
        notification = self.get_object()
        
        # Check if user owns this notification
        if notification.user != request.user:
            return Response(
                {'error': 'You can only mark your own notifications as unread'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.mark_as_unread()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_all_as_read(self, request):
        """
        Mark all unread notifications as read for the current user
        """
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        
        count = 0
        for notification in notifications:
            notification.mark_as_read()
            count += 1
        
        return Response({
            'marked_as_read_count': count,
            'message': f'{count} notifications marked as read'
        })
    
    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated])
    def clear_read(self, request):
        """
        Delete all read notifications for the current user
        """
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=True
        )
        
        count = notifications.count()
        notifications.delete()
        
        return Response({
            'deleted_count': count,
            'message': f'{count} read notifications deleted'
        })
