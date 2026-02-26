from django.db import models
from django.utils import timezone
from django.core.validators import URLValidator, EmailValidator
from django.db.models import Q


class VehicleType(models.Model):
    """Vehicle types like Rickshaw, Truck, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Icon name or emoji")
    permit_duration_days = models.IntegerField(default=365, help_text="Default permit validity in days (365 = 1 year)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Vehicle Type"
        verbose_name_plural = "Vehicle Types"

    def __str__(self):
        return self.name


class PermitType(models.Model):
    """Permit types like Transport, Goods, Passenger, etc."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, help_text="Short code like 'TRN', 'GDS', 'PSN'")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Permit Type"
        verbose_name_plural = "Permit Types"

    def __str__(self):
        return f"{self.name} ({self.code})"


class Permit(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
    ]

    AUTHORITY_CHOICES = [
        ('PTA', 'Provincial Transport Authority'),
        ('RTA', 'Regional Transport Authority'),
    ]

    # Basic Information
    permit_number = models.CharField(max_length=50, db_index=True, blank=True, null=True, help_text="Auto-generated on submission")
    authority = models.CharField(max_length=10, choices=AUTHORITY_CHOICES)
    permit_type = models.ForeignKey(PermitType, on_delete=models.SET_NULL, null=True, blank=True, related_name='permits', help_text="Permit type")
    
    # Vehicle Information
    vehicle_number = models.CharField(max_length=20, db_index=True, blank=True, null=True)
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.SET_NULL, null=True, blank=True, related_name='permits', help_text="Vehicle type")
    vehicle_make = models.CharField(max_length=100, blank=True, null=True)
    vehicle_model = models.CharField(max_length=100, blank=True, null=True)
    vehicle_year = models.IntegerField(blank=True, null=True)
    vehicle_capacity = models.IntegerField(blank=True, null=True)
    
    # Owner Information
    owner_name = models.CharField(max_length=200, blank=True, null=True)
    owner_email = models.EmailField(blank=True, null=True)
    owner_phone = models.CharField(max_length=20, blank=True, null=True)
    owner_address = models.TextField(blank=True, null=True)
    owner_cnic = models.CharField(max_length=20, blank=True, null=True)
    
    # Permit Details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    valid_from = models.DateField(blank=True, null=True)
    valid_to = models.DateField(blank=True, null=True)
    issued_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    # Additional Information
    description = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    documents = models.FileField(upload_to='permits/%Y/%m/', blank=True, null=True)
    
    # Routes and Restrictions
    approved_routes = models.TextField(blank=True, null=True, help_text="Comma separated routes")
    restrictions = models.TextField(blank=True, null=True)
    
    # Created/Updated by
    created_by = models.CharField(max_length=200, blank=True, null=True)
    updated_by = models.CharField(max_length=200, blank=True, null=True)
    
    # Assigned to User
    assigned_to = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_permits',
        help_text="Supervisor/Operator/Administrator who is responsible for this permit"
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.CharField(max_length=200, blank=True, null=True)
    
    # Owner info for tracking who owns/created this permit (especially for drafts)
    user_owner = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_permits',
        help_text="User who owns this permit (created it)"
    )
    
    # Previous Permits References (for tracking expired permit reapplication)
    previous_permits_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of IDs of previous permits that this permit is a renewal of (tracks permit chain for expired permits)"
    )
    
    class Meta:
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['vehicle_number', 'status']),
            models.Index(fields=['owner_email']),
            models.Index(fields=['valid_from', 'valid_to']),
        ]

    def __str__(self):
        return f"{self.permit_number} - {self.vehicle_number}"

    def is_valid(self):
        """Check if permit is currently valid"""
        if not self.valid_from or not self.valid_to:
            return False
        today = timezone.now().date()
        return self.status == 'active' and self.valid_from <= today <= self.valid_to

    def check_and_update_expired_status(self):
        """
        Check if permit has expired (valid_to date has passed).
        If expired and not already marked as expired, automatically update status to 'expired'.
        Returns True if status was updated, False otherwise.
        """
        if not self.valid_to:
            return False
        today = timezone.now().date()
        # Check if the permit date has passed and status is not already expired
        if today > self.valid_to and self.status != 'expired':
            self.status = 'expired'
            self.save(update_fields=['status', 'last_modified'])
            print(f"[AUTO-EXPIRE] Permit {self.permit_number} automatically marked as expired (valid_to: {self.valid_to}, today: {today})")
            return True
        return False

    def renew(self, new_valid_to):
        """Renew the permit"""
        old_valid_to = self.valid_to
        old_status = self.status
        self.valid_to = new_valid_to
        self.status = 'active'
        self.save()
        return {
            'valid_to': {'old': str(old_valid_to), 'new': str(new_valid_to)},
            'status': {'old': old_status, 'new': 'active'}
        }

    def cancel(self):
        """Cancel the permit"""
        old_status = self.status
        self.status = 'cancelled'
        self.save()
        return {
            'status': {'old': old_status, 'new': 'cancelled'}
        }

    def deactivate(self):
        """Deactivate the permit"""
        old_status = self.status
        self.status = 'inactive'
        self.save()
        return {
            'status': {'old': old_status, 'new': 'inactive'}
        }

    def activate(self):
        """Activate the permit"""
        old_status = self.status
        self.status = 'active'
        self.save()
        return {
            'status': {'old': old_status, 'new': 'active'}
        }

    def get_previous_permits(self):
        """Get all previous permits referenced by this permit"""
        if not self.previous_permits_ids:
            return []
        return Permit.objects.filter(id__in=self.previous_permits_ids).order_by('-issued_date')

    def get_full_permit_chain(self):
        """Get the complete chain of previous permits (recursively)"""
        chain = [self]
        current_permit = self
        
        while current_permit.previous_permits_ids:
            # Get the first (most recent) previous permit
            previous_permits = current_permit.get_previous_permits()
            if previous_permits.exists():
                current_permit = previous_permits.first()
                chain.append(current_permit)
            else:
                break
        
        return chain

    def add_previous_permit_reference(self, previous_permit_id):
        """Add a reference to a previous permit (for expired permit renewals)"""
        if self.previous_permits_ids is None:
            self.previous_permits_ids = []
        
        if previous_permit_id not in self.previous_permits_ids:
            self.previous_permits_ids.append(previous_permit_id)
            self.save(update_fields=['previous_permits_ids'])
            return True
        return False
    
    def has_previous_permits(self):
        """Check if this permit has references to previous permits"""
        return bool(self.previous_permits_ids and len(self.previous_permits_ids) > 0)


class VehicleFeeStructure(models.Model):
    """
    Fee structure for different vehicle types
    Stores the base fee for each vehicle type for chalan management
    """
    vehicle_type = models.OneToOneField(
        VehicleType,
        on_delete=models.CASCADE,
        related_name='fee_structure',
        help_text="Vehicle type"
    )
    base_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Base fee for this vehicle type"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description or notes about this fee structure"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this fee structure is active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicle_fee_updates',
        help_text="User who last updated this fee structure"
    )

    class Meta:
        ordering = ['vehicle_type__name']
        verbose_name = "Vehicle Fee Structure"
        verbose_name_plural = "Vehicle Fee Structures"

    def __str__(self):
        return f"{self.vehicle_type.name} - {self.base_fee}"


class BankAccount(models.Model):
    """Bank Account Information for Payment Collection"""
    
    BANK_CHOICES = [
        ('sbp', 'State Bank of Pakistan'),
        ('nbp', 'National Bank of Pakistan'),
        ('hbl', 'Habib Bank Limited'),
        ('ufb', 'United Bank Limited'),
        ('abl', 'Allied Bank'),
        ('scb', 'Standard Chartered Bank'),
        ('other', 'Other'),
    ]
    
    # Bank Details
    bank_name = models.CharField(max_length=100)
    bank_type = models.CharField(max_length=20, choices=BANK_CHOICES, default='other')
    account_title = models.CharField(max_length=200, help_text="Name of account holder/organization")
    account_number = models.CharField(max_length=50, unique=True, db_index=True)
    iban = models.CharField(max_length=50, unique=True, help_text="International Bank Account Number")
    branch_code = models.CharField(max_length=20, blank=True, null=True)
    routing_number = models.CharField(max_length=20, blank=True, null=True)
    swift_code = models.CharField(max_length=20, blank=True, null=True, help_text="SWIFT code for international transfers")
    
    # Account Information
    is_active = models.BooleanField(default=True)
    is_primary = models.BooleanField(default=False, help_text="Primary account for automatic payment collection")
    description = models.TextField(blank=True, null=True, help_text="Additional notes about this account")
    
    # Contact Information
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    
    # Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=200, blank=True, null=True)
    updated_by = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        verbose_name = "Bank Account"
        verbose_name_plural = "Bank Accounts"
        ordering = ['-is_primary', '-is_active', 'bank_name']
    
    def __str__(self):
        return f"{self.bank_name} - {self.account_number}"


class Chalan(models.Model):
    """
    Chalan (Traffic Violation/Penalty) Management System
    Stores traffic violations/penalties issued to vehicle owners
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
        ('resolved', 'Resolved'),
    ]

    # Basic Information
    chalan_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # User Information
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chalans',
        help_text="User/Owner against whom chalan is issued"
    )
    owner_name = models.CharField(max_length=200)
    owner_cnic = models.CharField(max_length=20, db_index=True, help_text="Owner's CNIC for identification")
    owner_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Permit Information
    permit = models.ForeignKey(
        Permit,
        on_delete=models.CASCADE,
        related_name='chalans',
        help_text="Associated permit"
    )
    
    # Vehicle Information
    car_number = models.CharField(max_length=20, db_index=True, help_text="Vehicle registration number")
    vehicle_type = models.ForeignKey(
        VehicleType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chalans_by_type',
        help_text="Vehicle type (from permit)"
    )
    
    # Bank Account for Payment
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chalans',
        help_text="Bank account for payment collection"
    )
    
    # Chalan Details
    violation_description = models.TextField(help_text="Description of the traffic violation")
    fees_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount of fine/fee for this violation"
    )
    
    # Status and Payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount paid by the owner"
    )
    payment_date = models.DateTimeField(null=True, blank=True, help_text="When the chalan was paid")
    payment_reference = models.CharField(max_length=100, blank=True, null=True, help_text="Payment transaction reference")
    
    # Issue Details
    issued_date = models.DateTimeField(auto_now_add=True)
    issued_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_chalans',
        help_text="Officer who issued the chalan"
    )
    issue_location = models.CharField(max_length=255, blank=True, null=True)
    
    # Additional Information
    remarks = models.TextField(blank=True, null=True)
    document = models.FileField(upload_to='chalan_documents/%Y/%m/', blank=True, null=True)
    
    # Audit Fields
    created_by = models.CharField(max_length=200, blank=True, null=True)
    updated_by = models.CharField(max_length=200, blank=True, null=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['car_number', 'status']),
            models.Index(fields=['owner_cnic']),
            models.Index(fields=['permit', 'status']),
        ]
        verbose_name = 'Chalan'
        verbose_name_plural = 'Chalans'

    def __str__(self):
        return f"{self.chalan_number} - {self.car_number}"

    def is_paid(self):
        """Check if chalan has been fully paid"""
        return self.status == 'paid' and self.paid_amount >= self.fees_amount

    def get_remaining_amount(self):
        """Get remaining amount to be paid"""
        return self.fees_amount - self.paid_amount

    def mark_as_paid(self, payment_ref=None):
        """Mark chalan as paid"""
        old_status = self.status
        self.status = 'paid'
        self.paid_amount = self.fees_amount
        self.payment_date = timezone.now()
        if payment_ref:
            self.payment_reference = payment_ref
        self.save()
        return {
            'status': {'old': old_status, 'new': 'paid'},
            'paid_amount': {'old': 0, 'new': str(self.fees_amount)}
        }


class ChalanHistory(models.Model):
    """
    Track changes and actions on chalans
    """
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('paid', 'Payment Received'),
        ('cancelled', 'Cancelled'),
        ('fee_updated', 'Fee Updated'),
        ('disputed', 'Disputed'),
        ('resolved', 'Resolved'),
    ]

    chalan = models.ForeignKey(Chalan, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.CharField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(default=dict, blank=True, help_text="Stores field changes")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Chalan History'
        verbose_name_plural = 'Chalan Histories'

    def __str__(self):
        return f"{self.chalan.chalan_number} - {self.action} on {self.timestamp}"


class PermitDocument(models.Model):
    """Store multiple documents for a permit"""
    DOCUMENT_TYPE_CHOICES = [
        ('registration', 'Vehicle Registration'),
        ('insurance', 'Insurance Document'),
        ('tax', 'Tax Document'),
        ('fitness', 'Fitness Certificate'),
        ('cnic', 'CNIC Copy'),
        ('route_map', 'Route Map'),
        ('authorization', 'Authorization Letter'),
        ('other', 'Other Document'),
    ]

    permit = models.ForeignKey(Permit, on_delete=models.CASCADE, related_name='permit_documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='permit_documents/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField()  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.CharField(max_length=200, blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Permit Document'
        verbose_name_plural = 'Permit Documents'

    def __str__(self):
        return f"{self.permit.permit_number} - {self.get_document_type_display()}"

    def get_file_extension(self):
        """Get file extension"""
        return self.filename.split('.')[-1].upper()

    def get_file_size_display(self):
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class PermitHistory(models.Model):
    """Track changes to permits"""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('activated', 'Activated'),
        ('deactivated', 'Deactivated'),
        ('cancelled', 'Cancelled'),
        ('renewed', 'Renewed'),
    ]

    permit = models.ForeignKey(Permit, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.CharField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.permit.permit_number} - {self.action} on {self.timestamp}"

class Token(models.Model):
    """
    Custom token model for user authentication
    """
    key = models.CharField(max_length=64, primary_key=True)
    user = models.OneToOneField('auth.User', related_name='auth_token', on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.key

    class Meta:
        verbose_name = "Token"
        verbose_name_plural = "Tokens"


class Feature(models.Model):
    """
    Features/Permissions that can be assigned to roles
    """
    FEATURE_CHOICES = [
        ('permit_view', 'View Permits'),
        ('permit_create', 'Create Permits'),
        ('permit_edit', 'Edit Permits'),
        ('permit_delete', 'Delete Permits'),
        ('permit_check', 'Check Permits'),
        ('permit_submit', 'Submit Permits'),
        ('permit_share', 'Share Permits'),
        ('permit_renew', 'Renew Permits'),
        ('permit_cancel', 'Cancel Permits'),
        ('chalan_view', 'View Chalans'),
        ('chalan_create', 'Create Chalans'),
        ('chalan_edit', 'Edit Chalans'),
        ('chalan_manage_fees', 'Manage Chalan Fees'),
        ('chalan_mark_paid', 'Mark Chalan as Paid'),
        ('chalan_cancel', 'Cancel Chalans'),
        ('chalan_vehicle_fee_view', 'View Vehicle Fee Structures'),
        ('chalan_vehicle_fee_manage', 'Manage Vehicle Fee Structures'),
        ('user_manage', 'Manage Users'),
        ('role_manage', 'Manage Roles'),
        ('report_view', 'View Reports'),
        ('dashboard_view', 'View Dashboard'),
        ('employee', 'Is Employee'),
    ]

    name = models.CharField(
        max_length=50,
        unique=True,
        choices=FEATURE_CHOICES,
        help_text="System feature identifier"
    )
    description = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Feature"
        verbose_name_plural = "Features"

    def __str__(self):
        return f"{self.get_name_display()}"


class Role(models.Model):
    """
    User roles with assigned features/permissions
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('user', 'End User'),
        ('operator', 'Operator'),
        ('supervisor', 'Supervisor'),
    ]

    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Role identifier (lowercase, no spaces)"
    )
    description = models.TextField(blank=True)
    features = models.ManyToManyField(
        Feature,
        related_name='roles',
        help_text="Features/permissions assigned to this role"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Role"
        verbose_name_plural = "Roles"

    def __str__(self):
        return f"{self.get_name_display()}"

    def get_name_display(self):
        """Return display name for the role"""
        # Check if it's a predefined choice
        for choice_value, choice_display in self.ROLE_CHOICES:
            if choice_value == self.name:
                return choice_display
        # Otherwise capitalize the name
        return self.name.replace('_', ' ').title()

    def has_feature(self, feature_name):
        """Check if role has a specific feature"""
        return self.features.filter(name=feature_name).exists()


class UserRole(models.Model):
    """
    Assign roles to users with time validity
    """
    user = models.OneToOneField(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='user_role'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        related_name='users'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_roles'
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "User Role"
        verbose_name_plural = "User Roles"
        unique_together = ['user', 'role']

    def __str__(self):
        return f"{self.user.username} - {self.role.get_name_display()}"


class Event(models.Model):
    """
    Master list of all events/actions that can occur in the system.
    Admin can assign these events to roles as features.
    This ensures centralized control of all application permissions.
    """
    EVENT_CATEGORY_CHOICES = [
        ('permit', 'Permit Operations'),
        ('document', 'Document Management'),
        ('user', 'User Management'),
        ('role', 'Role Management'),
        ('system', 'System Operations'),
        ('report', 'Reporting'),
        ('audit', 'Audit Operations'),
    ]

    # Event identification
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique code like 'permit_create', 'permit_approve', etc."
    )
    name = models.CharField(max_length=200, help_text="Human-readable event name")
    description = models.TextField(blank=True, help_text="Detailed description of what this event logs")
    category = models.CharField(max_length=20, choices=EVENT_CATEGORY_CHOICES, default='permit')

    # Control settings
    is_active = models.BooleanField(default=True, help_text="Whether this event can be logged")
    is_auditable = models.BooleanField(
        default=True,
        help_text="Whether logs of this event appear in audit reports"
    )
    requires_approval = models.BooleanField(
        default=False,
        help_text="Whether this action requires approval before execution"
    )
    severity_level = models.IntegerField(
        default=1,
        choices=[(1, 'Low'), (2, 'Medium'), (3, 'High'), (4, 'Critical')],
        help_text="Severity for audit purposes"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'code']
        verbose_name = "Event"
        verbose_name_plural = "Events"
        indexes = [
            models.Index(fields=['code', 'is_active']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class EventLog(models.Model):
    """
    Log every action/event that occurs in the system.
    Provides complete audit trail for compliance and debugging.
    """
    # Event Reference
    event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        related_name='logs',
        help_text="The event type"
    )
    
    # Actor information
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='event_logs',
        help_text="User who performed the action"
    )
    
    # Entity information
    content_type = models.CharField(
        max_length=50,
        help_text="Type of object affected (e.g., 'permit', 'user', 'document')"
    )
    object_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the affected object"
    )
    object_description = models.CharField(
        max_length=500,
        blank=True,
        help_text="Human-readable description of affected object"
    )
    
    # Change data
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dictionary of changes: {'field_name': {'old': old_value, 'new': new_value}}"
    )
    
    # Request context
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the request"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string of the request"
    )
    request_method = models.CharField(
        max_length=10,
        blank=True,
        help_text="HTTP method (GET, POST, PUT, DELETE, etc.)"
    )
    endpoint = models.CharField(
        max_length=500,
        blank=True,
        help_text="API endpoint that was called"
    )
    
    # Status and result
    status = models.CharField(
        max_length=20,
        choices=[
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('pending', 'Pending'),
            ('rejected', 'Rejected'),
            ('cancelled', 'Cancelled'),
        ],
        default='success',
        help_text="Outcome of the action"
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error message if action failed"
    )
    
    # Additional notes
    notes = models.TextField(
        blank=True,
        help_text="Additional context or notes about this action"
    )
    
    # Timestamps
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the action occurred"
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Event Log"
        verbose_name_plural = "Event Logs"
        indexes = [
            models.Index(fields=['event', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['status', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.event.code} by {self.user.username if self.user else 'system'} at {self.timestamp}"


class SystemConfig(models.Model):
    """
    Store system-wide configuration and settings.
    Ensures only one admin user cannot be deleted for system integrity.
    """
    # Security settings
    admin_user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_config',
        help_text="Super admin user that cannot be deleted"
    )
    
    # Logging settings
    log_retention_days = models.IntegerField(
        default=365,
        help_text="Number of days to retain event logs"
    )
    enable_detailed_logging = models.BooleanField(
        default=True,
        help_text="Whether to log detailed change information"
    )
    
    # Audit settings
    audit_critical_events = models.BooleanField(
        default=True,
        help_text="Automatically flag critical events for audit review"
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "System Configuration"
        verbose_name_plural = "System Configuration"

    def __str__(self):
        return "System Configuration"


class Notification(models.Model):
    """
    Notification system for permit assignments and other system events.
    Stores notifications for users with read/unread status.
    """
    
    NOTIFICATION_TYPES = [
        ('permit_assigned', 'Permit Assigned'),
        ('permit_status_changed', 'Permit Status Changed'),
        ('permit_updated', 'Permit Updated'),
        ('system_info', 'System Information'),
        ('alert', 'Alert'),
        ('reminder', 'Reminder'),
    ]
    
    # Notification content
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="User receiving the notification"
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default='system_info',
        db_index=True
    )
    title = models.CharField(
        max_length=200,
        help_text="Notification title"
    )
    message = models.TextField(
        help_text="Notification message content"
    )
    
    # Related object
    permit = models.ForeignKey(
        Permit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text="Related permit (if applicable)"
    )
    
    # Status tracking
    is_read = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether user has read this notification"
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the user read this notification"
    )
    
    # Email tracking
    email_sent = models.BooleanField(
        default=False,
        help_text="Whether email notification was sent"
    )
    email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the email notification was sent"
    )
    
    # Action URL
    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to navigate to when notification is clicked"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
        ]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            return True
        return False
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
            return True
        return False