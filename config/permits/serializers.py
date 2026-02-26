from rest_framework import serializers
from .models import Permit, PermitHistory, PermitDocument, Feature, Role, UserRole, PermitType, VehicleType, Chalan, ChalanHistory, VehicleFeeStructure, BankAccount, Notification
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate


class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = ['id', 'name', 'description', 'icon', 'permit_duration_days', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermitType
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PermitHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PermitHistory
        fields = ['id', 'action', 'performed_by', 'timestamp', 'changes', 'notes']
        read_only_fields = ['timestamp']


class PermitDocumentSerializer(serializers.ModelSerializer):
    file_size_display = serializers.SerializerMethodField()
    file_extension = serializers.SerializerMethodField()

    class Meta:
        model = PermitDocument
        fields = [
            'id', 'permit', 'document_type', 'file', 'filename', 
            'file_size', 'file_size_display', 'file_extension', 
            'uploaded_at', 'uploaded_by', 'description', 
            'is_verified', 'verified_by', 'verified_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_size', 'filename', 'file_size_display', 'file_extension']

    def get_file_size_display(self, obj):
        return obj.get_file_size_display()

    def get_file_extension(self, obj):
        return obj.get_file_extension()

    def create(self, validated_data):
        # Store filename and file size
        file_obj = validated_data['file']
        validated_data['filename'] = file_obj.name
        validated_data['file_size'] = file_obj.size
        return super().create(validated_data)


class PermitHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PermitHistory
        fields = ['id', 'action', 'performed_by', 'timestamp', 'changes', 'notes']
        read_only_fields = ['timestamp']


class PermitSerializer(serializers.ModelSerializer):
    history = PermitHistorySerializer(many=True, read_only=True)
    permit_documents = PermitDocumentSerializer(many=True, read_only=True)
    is_valid = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    permit_number = serializers.CharField(read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    assigned_to_full_name = serializers.SerializerMethodField()
    assigned_to_role = serializers.SerializerMethodField()
    permit_type = PermitTypeSerializer(read_only=True)
    vehicle_type = VehicleTypeSerializer(read_only=True)
    previous_permits = serializers.SerializerMethodField()
    permit_chain = serializers.SerializerMethodField()
    has_previous_permits = serializers.SerializerMethodField()
    is_renewal = serializers.SerializerMethodField()
    
    # Add writable fields that accept IDs directly
    permit_type_write = serializers.PrimaryKeyRelatedField(
        queryset=PermitType.objects.all(),
        source='permit_type',
        write_only=True,
        allow_null=True,
        required=False
    )
    vehicle_type_write = serializers.PrimaryKeyRelatedField(
        queryset=VehicleType.objects.all(),
        source='vehicle_type',
        write_only=True,
        allow_null=True,
        required=False
    )
    
    permit_type_id = serializers.PrimaryKeyRelatedField(
        queryset=PermitType.objects.all(),
        source='permit_type',
        allow_null=True,
        required=False
    )
    vehicle_type_id = serializers.PrimaryKeyRelatedField(
        queryset=VehicleType.objects.all(),
        source='vehicle_type',
        allow_null=True,
        required=False
    )

    class Meta:
        model = Permit
        fields = [
            'id', 'permit_number', 'authority', 'permit_type', 'permit_type_id', 'permit_type_write',
            'vehicle_number', 'vehicle_type', 'vehicle_type_id', 'vehicle_type_write', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_capacity',
            'owner_name', 'owner_email', 'owner_phone', 'owner_address', 'owner_cnic',
            'status', 'valid_from', 'valid_to', 'issued_date', 'last_modified',
            'description', 'remarks', 'documents', 'approved_routes', 'restrictions',
            'created_by', 'updated_by', 'assigned_to', 'assigned_to_username', 'assigned_to_full_name', 'assigned_to_role',
            'assigned_at', 'assigned_by', 'user_owner', 'is_valid', 'days_remaining', 'history', 'permit_documents',
            'previous_permits_ids', 'previous_permits', 'permit_chain', 'has_previous_permits', 'is_renewal'
        ]
        read_only_fields = ['id', 'issued_date', 'last_modified', 'history', 'permit_documents', 
                           'assigned_to_username', 'assigned_to_full_name', 'assigned_to_role', 'assigned_at', 'assigned_by',
                           'previous_permits', 'permit_chain', 'has_previous_permits', 'is_renewal', 'user_owner']

    def get_assigned_to_full_name(self, obj):
        if obj.assigned_to:
            # Use full name if available, otherwise use username
            full_name = obj.assigned_to.get_full_name()
            return full_name if full_name.strip() else obj.assigned_to.username
        return None

    def get_assigned_to_role(self, obj):
        if obj.assigned_to:
            # Get the role of the assigned user from their UserRole relationship
            try:
                user_role = UserRole.objects.filter(user=obj.assigned_to).first()
                if user_role and user_role.role:
                    return user_role.role.name.lower()  # Return role name as lowercase
            except Exception as e:
                print(f"Error getting assigned user role: {e}")
                pass
        return None

    def get_previous_permits(self, obj):
        """Get all previous permits referenced by this permit (basic info)"""
        if not obj.has_previous_permits():
            return None
        
        previous_permits = obj.get_previous_permits()
        return [
            {
                'id': permit.id,
                'permit_number': permit.permit_number,
                'status': permit.status,
                'valid_from': permit.valid_from,
                'valid_to': permit.valid_to,
                'issued_date': permit.issued_date,
            }
            for permit in previous_permits
        ]

    def get_permit_chain(self, obj):
        """Get the complete chain of permits (all previous permits recursively)"""
        if not obj.has_previous_permits():
            return None
        
        chain = obj.get_full_permit_chain()
        return [
            {
                'id': permit.id,
                'permit_number': permit.permit_number,
                'status': permit.status,
                'valid_from': permit.valid_from,
                'valid_to': permit.valid_to,
                'issued_date': permit.issued_date,
            }
            for permit in chain
        ]

    def get_has_previous_permits(self, obj):
        """Check if this permit has references to previous permits"""
        return obj.has_previous_permits()

    def get_is_renewal(self, obj):
        """Check if this permit is a renewal of an expired permit"""
        return obj.has_previous_permits() or bool(obj.previous_permits_ids)

    def get_is_valid(self, obj):
        return obj.is_valid()

    def get_days_remaining(self, obj):
        if not obj.valid_to:
            return None
        today = timezone.now().date()
        if obj.valid_to >= today:
            return (obj.valid_to - today).days
        return 0

    def validate_vehicle_number(self, value):
        """Validate that vehicle number is unique for active and pending permits"""
        if not value:
            return value
        
        # Check for active or pending permits with the same vehicle number
        query = Permit.objects.filter(
            vehicle_number__iexact=value,
            status__in=['active', 'pending']
        )
        
        # If updating, exclude the current permit
        if self.instance:
            query = query.exclude(id=self.instance.id)
        
        if query.exists():
            existing_permit = query.first()
            raise serializers.ValidationError(
                f"Vehicle number '{value}' is already registered with an ACTIVE permit ({existing_permit.permit_number}). "
                f"You can only create a new permit if the existing one expires."
            )
        
        return value

    def to_internal_value(self, data):
        """Handle incoming permit_type and vehicle_type as direct IDs"""
        # Make a copy so we don't modify the original
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # If permit_type is provided as a direct ID (not _id), handle it
        if 'permit_type' in mutable_data and 'permit_type_id' not in mutable_data and 'permit_type_write' not in mutable_data:
            mutable_data['permit_type_write'] = mutable_data.pop('permit_type')
        
        # If vehicle_type is provided as a direct ID (not _id), handle it
        if 'vehicle_type' in mutable_data and 'vehicle_type_id' not in mutable_data and 'vehicle_type_write' not in mutable_data:
            mutable_data['vehicle_type_write'] = mutable_data.pop('vehicle_type')
        
        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        # Only generate permit number if NOT a draft
        # Drafts will get permit_number generated when submitted
        if validated_data.get('status') != 'draft':
            import uuid
            permit_type = validated_data.get('permit_type')
            permit_type_code = permit_type.code if permit_type else 'GEN'
            permit_number = f"{validated_data['authority']}-{permit_type_code}-{uuid.uuid4().hex[:8].upper()}"
            validated_data['permit_number'] = permit_number
        return super().create(validated_data)

    def to_representation(self, instance):
        """
        Override to_representation to automatically check and update expired permits
        before serializing them.
        """
        # Check if permit has expired and auto-update status if needed
        instance.check_and_update_expired_status()
        
        # Return the serialized data
        return super().to_representation(instance)


class PermitStatsSerializer(serializers.Serializer):
    """Serializer for permit statistics"""
    totalPermits = serializers.IntegerField()
    activePermits = serializers.IntegerField()
    inactivePermits = serializers.IntegerField()
    cancelledPermits = serializers.IntegerField()
    expiredPermits = serializers.IntegerField()
    pendingPermits = serializers.IntegerField()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        data['user'] = user
        return data


class FeatureSerializer(serializers.ModelSerializer):
    """Serializer for Feature model"""
    display_name = serializers.CharField(source='get_name_display', read_only=True)

    class Meta:
        model = Feature
        fields = ('id', 'name', 'display_name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model"""
    features = FeatureSerializer(many=True, read_only=True)
    feature_ids = serializers.PrimaryKeyRelatedField(
        queryset=Feature.objects.all(),
        many=True,
        write_only=True,
        source='features',
        required=False
    )
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = (
            'id', 'name', 'display_name', 'description', 'features', 'feature_ids',
            'is_active', 'created_at', 'updated_at', 'user_count'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for UserRole model"""
    user_details = UserSerializer(source='user', read_only=True)
    role_details = RoleSerializer(source='role', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)

    class Meta:
        model = UserRole
        fields = (
            'id', 'user', 'user_details', 'role', 'role_details',
            'assigned_at', 'assigned_by', 'assigned_by_username', 'is_active', 'notes'
        )
        read_only_fields = ('id', 'assigned_at', 'assigned_by')


class UserDetailSerializer(serializers.ModelSerializer):
    """Extended User serializer with role information"""
    role = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'role', 'features')
        read_only_fields = ('id',)

    def get_role(self, obj):
        try:
            user_role = obj.user_role
            return RoleSerializer(user_role.role).data
        except UserRole.DoesNotExist:
            return None

    def get_features(self, obj):
        """Get all features accessible by the user through their role"""
        try:
            user_role = obj.user_role
            if user_role.is_active and user_role.role:
                features = user_role.role.features.all()
                return [{'name': f.name, 'display_name': f.get_name_display()} for f in features]
        except UserRole.DoesNotExist:
            pass
        return []


# ==================== BANK ACCOUNT SERIALIZER ====================

class BankAccountSerializer(serializers.ModelSerializer):
    """Serializer for Bank Account information"""
    class Meta:
        model = BankAccount
        fields = [
            'id', 'bank_name', 'bank_type', 'account_title', 'account_number',
            'iban', 'branch_code', 'routing_number', 'swift_code',
            'is_active', 'is_primary', 'description', 'contact_person',
            'contact_phone', 'contact_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ==================== CHALAN MANAGEMENT SERIALIZERS ====================

class ChalanHistorySerializer(serializers.ModelSerializer):
    """Serializer for Chalan history tracking"""
    class Meta:
        model = ChalanHistory
        fields = ['id', 'chalan', 'action', 'performed_by', 'timestamp', 'changes', 'notes']
        read_only_fields = ['id', 'timestamp', 'chalan']


class ChalanListSerializer(serializers.ModelSerializer):
    """Serializer for listing chalans (limited fields for performance)"""
    remaining_amount = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='user.username', read_only=True)
    permit_number = serializers.CharField(source='permit.permit_number', read_only=True)
    vehicle_type_name = serializers.CharField(source='vehicle_type.name', read_only=True)
    
    class Meta:
        model = Chalan
        fields = [
            'id', 'chalan_number', 'owner_name', 'owner_cnic', 'car_number',
            'permit_number', 'owner_username', 'vehicle_type', 'vehicle_type_name',
            'fees_amount', 'paid_amount', 'remaining_amount', 'status', 
            'issued_date', 'payment_date'
        ]
        read_only_fields = [
            'id', 'chalan_number', 'issued_date', 'payment_date', 'vehicle_type_name'
        ]
    
    def get_remaining_amount(self, obj):
        return str(obj.get_remaining_amount())


class ChalanDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed chalan view"""
    remaining_amount = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='user.username', read_only=True)
    permit_details = serializers.SerializerMethodField()
    vehicle_type_name = serializers.CharField(source='vehicle_type.name', read_only=True)
    vehicle_type_icon = serializers.CharField(source='vehicle_type.icon', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.username', read_only=True)
    bank_account = BankAccountSerializer(read_only=True)
    history = ChalanHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Chalan
        fields = [
            'id', 'chalan_number', 'owner_name', 'owner_cnic', 'owner_phone',
            'car_number', 'owner_username', 'user', 'permit', 'permit_details',
            'vehicle_type', 'vehicle_type_name', 'vehicle_type_icon',
            'violation_description', 'fees_amount', 'paid_amount', 'remaining_amount',
            'is_paid', 'status', 'issued_date', 'issued_by', 'issued_by_name',
            'issue_location', 'payment_date', 'payment_reference', 'remarks',
            'bank_account', 'document', 'created_by', 'updated_by', 'last_modified', 'history'
        ]
        read_only_fields = [
            'id', 'chalan_number', 'issued_date', 'last_modified', 'history',
            'vehicle_type_name', 'vehicle_type_icon', 'bank_account'
        ]
    
    def get_remaining_amount(self, obj):
        return str(obj.get_remaining_amount())
    
    def get_is_paid(self, obj):
        return obj.is_paid()
    
    def get_permit_details(self, obj):
        """Return brief permit details"""
        if obj.permit:
            return {
                'id': obj.permit.id,
                'permit_number': obj.permit.permit_number,
                'vehicle_number': obj.permit.vehicle_number,
                'owner_name': obj.permit.owner_name,
                'valid_from': str(obj.permit.valid_from),
                'valid_to': str(obj.permit.valid_to),
                'status': obj.permit.status
            }
        return None


class ChalanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chalans with auto-fee calculation"""
    auto_calculate_fee = serializers.BooleanField(
        default=True,
        write_only=True,
        help_text="Whether to auto-calculate fee from vehicle type"
    )
    
    class Meta:
        model = Chalan
        fields = [
            'owner_name', 'owner_cnic', 'owner_phone', 'car_number',
            'permit', 'user', 'vehicle_type', 'violation_description', 'fees_amount',
            'issue_location', 'remarks', 'document', 'auto_calculate_fee'
        ]
    
    def create(self, validated_data):
        """Create new chalan with auto-generated chalan number and optional fee calculation"""
        # Remove auto_calculate_fee from validated_data
        auto_calculate_fee = validated_data.pop('auto_calculate_fee', True)
        
        # Get permit to extract vehicle_type if not provided
        permit = validated_data.get('permit')
        if permit:
            if not validated_data.get('vehicle_type'):
                validated_data['vehicle_type'] = permit.vehicle_type
        
        # Auto-calculate fee from vehicle type if enabled and not provided
        if auto_calculate_fee and not validated_data.get('fees_amount'):
            vehicle_type = validated_data.get('vehicle_type')
            if vehicle_type:
                try:
                    fee_structure = vehicle_type.fee_structure
                    validated_data['fees_amount'] = fee_structure.base_fee
                except VehicleFeeStructure.DoesNotExist:
                    # If no fee structure exists, fees_amount must be provided
                    raise serializers.ValidationError(
                        "Auto-calculate fee enabled but no fee structure found for this vehicle type. "
                        "Please provide fees_amount manually."
                    )
        
        # Generate unique chalan number
        import datetime
        import random
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        random_suffix = str(random.randint(10000, 99999))
        chalan_number = f"CHL-{timestamp}-{random_suffix}"
        
        # Ensure uniqueness
        while Chalan.objects.filter(chalan_number=chalan_number).exists():
            random_suffix = str(random.randint(10000, 99999))
            chalan_number = f"CHL-{timestamp}-{random_suffix}"
        
        validated_data['chalan_number'] = chalan_number
        
        # Set created_by from request
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user.username
            validated_data['issued_by'] = request.user
        
        chalan = Chalan.objects.create(**validated_data)
        
        # Create history entry
        ChalanHistory.objects.create(
            chalan=chalan,
            action='created',
            performed_by=request.user.username if request and request.user else 'System',
            notes='Chalan created'
        )
        
        return chalan


class ChalanUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing chalans"""
    class Meta:
        model = Chalan
        fields = [
            'owner_name', 'owner_phone', 'violation_description', 'fees_amount',
            'status', 'issue_location', 'remarks', 'document'
        ]
    
    def update(self, instance, validated_data):
        """Update chalan and track changes"""
        request = self.context.get('request')
        user = request.user if request else None
        
        # Track changes for history
        changes = {}
        for field, value in validated_data.items():
            old_value = getattr(instance, field)
            if old_value != value:
                changes[field] = {'old': str(old_value), 'new': str(value)}
        
        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.updated_by = user.username if user else 'System'
        instance.save()
        
        # Create history entry if there were changes
        if changes:
            ChalanHistory.objects.create(
                chalan=instance,
                action='updated',
                performed_by=user.username if user else 'System',
                changes=changes
            )
        
        return instance


class ChalanPaymentSerializer(serializers.Serializer):
    """Serializer for marking chalan as paid"""
    payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_payment_amount(self, value):
        # This will be validated in the view
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than 0")
        return value


class ChalanFeeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating chalan fees (requires special permission)"""
    class Meta:
        model = Chalan
        fields = ['fees_amount']
    
    def update(self, instance, validated_data):
        """Update fees and track changes"""
        request = self.context.get('request')
        user = request.user if request else None
        
        old_amount = instance.fees_amount
        new_amount = validated_data.get('fees_amount', old_amount)
        
        instance.fees_amount = new_amount
        instance.updated_by = user.username if user else 'System'
        instance.save()
        
        # Create history entry
        ChalanHistory.objects.create(
            chalan=instance,
            action='fee_updated',
            performed_by=user.username if user else 'System',
            changes={
                'fees_amount': {'old': str(old_amount), 'new': str(new_amount)}
            }
        )
        
        return instance


class ChalanCancelSerializer(serializers.Serializer):
    """Serializer for cancelling chalans"""
    reason = serializers.CharField(
        max_length=500,
        help_text="Reason for cancellation"
    )

class VehicleFeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for viewing vehicle fee structures"""
    vehicle_type_name = serializers.CharField(source='vehicle_type.name', read_only=True)
    vehicle_type_icon = serializers.CharField(source='vehicle_type.icon', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = VehicleFeeStructure
        fields = [
            'id', 'vehicle_type', 'vehicle_type_name', 'vehicle_type_icon', 
            'base_fee', 'description', 'is_active', 
            'created_at', 'updated_at', 'updated_by', 'updated_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vehicle_type_name', 'vehicle_type_icon', 'updated_by_username']


class VehicleFeeStructureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vehicle fee structures"""
    class Meta:
        model = VehicleFeeStructure
        fields = ['vehicle_type', 'base_fee', 'description', 'is_active']


class VehicleFeeStructureUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating vehicle fee structures"""
    class Meta:
        model = VehicleFeeStructure
        fields = ['base_fee', 'description', 'is_active']
    
    def update(self, instance, validated_data):
        """Update fee structure and track changes"""
        request = self.context.get('request')
        user = request.user if request else None
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.updated_by = user
        instance.save()
        
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    permit_number = serializers.CharField(source='permit.permit_number', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_username', 'notification_type', 'title', 'message',
            'permit', 'permit_number', 'is_read', 'read_at', 'email_sent',
            'email_sent_at', 'action_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_username', 'permit_number', 'read_at', 'email_sent_at', 'created_at', 'updated_at']


class NotificationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing notifications"""
    permit_number = serializers.CharField(source='permit.permit_number', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'permit_number',
            'is_read', 'action_url', 'created_at'
        ]
        read_only_fields = ['id', 'permit_number', 'created_at']


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    is_read = serializers.BooleanField()
    
    def update(self, instance, validated_data):
        is_read = validated_data.get('is_read', instance.is_read)
        
        if is_read:
            instance.mark_as_read()
        else:
            instance.mark_as_unread()
        
        return instance