from django.contrib import admin
from .models import Permit, PermitHistory, Feature, Role, UserRole, PermitType, VehicleType, Chalan, ChalanHistory, BankAccount, Notification


@admin.register(PermitType)
class PermitTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ['name']

    fieldsets = (
        ('Permit Type Information', {
            'fields': ('name', 'code', 'description', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VehicleType)
class VehicleTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_permit_duration_display', 'is_active', 'icon', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ['name']

    fieldsets = (
        ('Vehicle Type Information', {
            'fields': ('name', 'description', 'icon', 'is_active')
        }),
        ('Permit Duration', {
            'fields': ('permit_duration_days',),
            'description': 'Default validity period for permits of this vehicle type (in days)'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_permit_duration_display(self, obj):
        """Display permit duration in a human-readable format"""
        days = obj.permit_duration_days
        years = days // 365
        months = (days % 365) // 30
        remaining_days = days % 30
        
        if years > 0 and months == 0 and remaining_days == 0:
            return f"{years} year(s)"
        elif months > 0 and remaining_days == 0:
            return f"{months} month(s)"
        elif years > 0:
            return f"{years}y {months}m"
        else:
            return f"{days} days"
    
    get_permit_duration_display.short_description = "Permit Duration"


@admin.register(Permit)
class PermitAdmin(admin.ModelAdmin):
    list_display = ('permit_number', 'vehicle_number', 'owner_name', 'authority', 'status', 'valid_from', 'valid_to')
    list_filter = ('status', 'authority', 'permit_type', 'issued_date')
    search_fields = ('permit_number', 'vehicle_number', 'owner_name', 'owner_email')
    readonly_fields = ('permit_number', 'issued_date', 'last_modified')
    fieldsets = (
        ('Permit Information', {
            'fields': ('permit_number', 'authority', 'permit_type', 'status')
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_number', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_capacity')
        }),
        ('Owner Information', {
            'fields': ('owner_name', 'owner_email', 'owner_phone', 'owner_address', 'owner_cnic')
        }),
        ('Permit Validity', {
            'fields': ('valid_from', 'valid_to', 'issued_date', 'last_modified')
        }),
        ('Additional Details', {
            'fields': ('description', 'remarks', 'documents', 'approved_routes', 'restrictions'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PermitHistory)
class PermitHistoryAdmin(admin.ModelAdmin):
    list_display = ('permit', 'action', 'performed_by', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('permit__permit_number', 'performed_by')
    readonly_fields = ('timestamp',)


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    ordering = ['name']

    fieldsets = (
        ('Feature Information', {
            'fields': ('name', 'description', 'created_at')
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'feature_count', 'user_count', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('features',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ['name']

    fieldsets = (
        ('Role Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Permissions', {
            'fields': ('features',),
            'description': 'Select features/permissions for this role'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def feature_count(self, obj):
        return obj.features.count()
    feature_count.short_description = 'Features Assigned'

    def user_count(self, obj):
        return obj.users.filter(is_active=True).count()
    user_count.short_description = 'Active Users'


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'is_active', 'assigned_at', 'assigned_by')
    list_filter = ('role', 'is_active', 'assigned_at')
    search_fields = ('user__username', 'user__email', 'role__name')
    readonly_fields = ('assigned_at',)
    ordering = ['-assigned_at']

    fieldsets = (
        ('User & Role', {
            'fields': ('user', 'role')
        }),
        ('Assignment Details', {
            'fields': ('is_active', 'notes', 'assigned_at', 'assigned_by')
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ['user', 'role']
        return self.readonly_fields


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'account_number', 'account_title', 'is_primary', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_primary', 'bank_type', 'created_at')
    search_fields = ('bank_name', 'account_number', 'iban', 'account_title', 'contact_person')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Bank Information', {
            'fields': ('bank_name', 'bank_type', 'account_title', 'account_number', 'iban', 'swift_code')
        }),
        ('Bank Details', {
            'fields': ('branch_code', 'routing_number', 'description'),
            'classes': ('collapse',)
        }),
        ('Account Status', {
            'fields': ('is_active', 'is_primary')
        }),
        ('Contact Information', {
            'fields': ('contact_person', 'contact_phone', 'contact_email')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user.username
        obj.updated_by = request.user.username
        super().save_model(request, obj, form, change)


@admin.register(Chalan)
class ChalanAdmin(admin.ModelAdmin):
    list_display = ('chalan_number', 'owner_name', 'car_number', 'status', 'fees_amount', 'paid_amount', 'issued_date')
    list_filter = ('status', 'issued_date', 'payment_date')
    search_fields = ('chalan_number', 'owner_name', 'owner_cnic', 'car_number', 'permit__permit_number')
    readonly_fields = ('chalan_number', 'issued_date', 'last_modified', 'get_remaining_amount')
    filter_horizontal = ()
    
    fieldsets = (
        ('Chalan Information', {
            'fields': ('chalan_number', 'status', 'violation_description')
        }),
        ('Owner Information', {
            'fields': ('owner_name', 'owner_cnic', 'owner_phone', 'user')
        }),
        ('Vehicle & Permit', {
            'fields': ('car_number', 'permit')
        }),
        ('Fee Details', {
            'fields': ('fees_amount', 'paid_amount', 'get_remaining_amount')
        }),
        ('Payment Information', {
            'fields': ('bank_account', 'payment_date', 'payment_reference')
        }),
        ('Issue Details', {
            'fields': ('issued_date', 'issued_by', 'issue_location')
        }),
        ('Additional Information', {
            'fields': ('remarks', 'document'),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_by', 'updated_by', 'last_modified'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields_for_paid = ('fees_amount', 'violation_description')

    def get_readonly_fields(self, request, obj=None):
        """Make fee fields readonly if chalan is paid or being edited with manage_fees permission"""
        readonly = list(self.readonly_fields)
        if obj and obj.status == 'paid':
            readonly.extend(['status', 'fees_amount'])
        elif obj and not self._user_can_manage_fees(request.user):
            readonly.extend(['fees_amount'])
        return readonly

    def _user_can_manage_fees(self, user):
        """Check if user has permission to manage chalan fees"""
        try:
            if user.is_staff or user.is_superuser:
                return True
            if hasattr(user, 'user_role') and user.user_role.role:
                return user.user_role.role.has_feature('chalan_manage_fees')
        except:
            pass
        return False

    def get_fieldsets(self, request, obj=None):
        """Adjust fieldsets based on user permissions and chalan status"""
        fieldsets = super().get_fieldsets(request, obj)
        if obj and obj.status == 'paid':
            # Hide fees field if already paid
            fieldsets = tuple(
                (name, options) for name, options in fieldsets
                if name != 'Fee Details'
            )
        return fieldsets


@admin.register(ChalanHistory)
class ChalanHistoryAdmin(admin.ModelAdmin):
    list_display = ('chalan', 'action', 'performed_by', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('chalan__chalan_number', 'performed_by')
    readonly_fields = ('timestamp', 'chalan', 'action', 'performed_by', 'changes', 'notes')
    ordering = ['-timestamp']

    def has_add_permission(self, request):
        """Prevent manual creation of history entries"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of history entries"""
        return False

    fieldsets = (
        ('Action Information', {
            'fields': ('chalan', 'action', 'performed_by', 'timestamp')
        }),
        ('Changes', {
            'fields': ('changes',)
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'email_sent', 'created_at')
    list_filter = ('notification_type', 'is_read', 'email_sent', 'created_at')
    search_fields = ('title', 'message', 'user__username', 'permit__permit_number')
    readonly_fields = ('created_at', 'updated_at', 'read_at', 'email_sent_at')
    ordering = ['-created_at']
    
    fieldsets = (
        ('Notification Content', {
            'fields': ('user', 'notification_type', 'title', 'message')
        }),
        ('Related Information', {
            'fields': ('permit', 'action_url'),
            'classes': ('collapse',)
        }),
        ('Read Status', {
            'fields': ('is_read', 'read_at'),
            'classes': ('collapse',)
        }),
        ('Email Status', {
            'fields': ('email_sent', 'email_sent_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Prevent manual creation of notifications - they should be created by signals"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion of notifications"""
        return request.user.is_superuser
