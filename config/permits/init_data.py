"""
Initial setup script to create default admin user and roles
Run this after migrations: python manage.py shell < config/permits/init_data.py
"""

from django.contrib.auth.models import User
from permits.models import Role, Feature, UserRole

def create_default_data():
    print("Creating default features...")
    
    # Define all features
    features_data = [
        ('permit_view', 'View Permits'),
        ('permit_create', 'Create Permits'),
        ('permit_edit', 'Edit Permits'),
        ('permit_delete', 'Delete Permits'),
        ('permit_check', 'Check Permits'),
        ('permit_submit', 'Submit Permits'),
        ('permit_share', 'Share Permits'),
        ('permit_renew', 'Renew Permits'),
        ('permit_cancel', 'Cancel Permits'),
        ('user_manage', 'Manage Users'),
        ('role_manage', 'Manage Roles'),
        ('report_view', 'View Reports'),
        ('dashboard_view', 'View Dashboard'),
    ]
    
    features = {}
    for feature_name, feature_display in features_data:
        feature, created = Feature.objects.get_or_create(
            name=feature_name,
            defaults={'description': feature_display}
        )
        features[feature_name] = feature
        if created:
            print(f"  ✓ Created feature: {feature_display}")
        else:
            print(f"  ✓ Feature already exists: {feature_display}")
    
    print("\nCreating default roles...")
    
    # Define roles with their features
    roles_config = {
        'admin': {
            'description': 'Administrator with full access to all features',
            'features': list(features.values())  # All features
        },
        'user': {
            'description': 'End user with basic permit access',
            'features': [
                features['permit_check'],
                features['permit_submit'],
                features['permit_share'],
                features['dashboard_view'],
            ]
        },
        'operator': {
            'description': 'Operator with permit management access',
            'features': [
                features['permit_view'],
                features['permit_create'],
                features['permit_edit'],
                features['permit_check'],
                features['permit_submit'],
                features['permit_share'],
                features['permit_renew'],
                features['dashboard_view'],
            ]
        },
        'supervisor': {
            'description': 'Supervisor with approval and reporting access',
            'features': [
                features['permit_view'],
                features['permit_edit'],
                features['permit_cancel'],
                features['permit_check'],
                features['report_view'],
                features['dashboard_view'],
            ]
        },
    }
    
    for role_name, role_config in roles_config.items():
        role, created = Role.objects.get_or_create(
            name=role_name,
            defaults={
                'description': role_config['description'],
                'is_active': True,
            }
        )
        
        if created:
            print(f"  ✓ Created role: {role.get_name_display()}")
            # Add features to the role
            role.features.set(role_config['features'])
            print(f"    Features assigned: {role.features.count()}")
        else:
            print(f"  ✓ Role already exists: {role.get_name_display()}")
            # Update features
            role.features.set(role_config['features'])
    
    print("\nCreating default admin user...")
    
    # Create default admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@transport-authority.local',
            'first_name': 'System',
            'last_name': 'Administrator',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    
    if created:
        admin_user.set_password('Admin@123')
        admin_user.save()
        print(f"  ✓ Created admin user: {admin_user.username}")
        print(f"    Email: {admin_user.email}")
        print(f"    Password: Admin@123 (Please change this!)")
    else:
        print(f"  ✓ Admin user already exists: {admin_user.username}")
    
    # Assign admin role to admin user
    admin_role = Role.objects.get(name='admin')
    user_role, created = UserRole.objects.get_or_create(
        user=admin_user,
        defaults={
            'role': admin_role,
            'is_active': True,
        }
    )
    
    if created:
        print(f"  ✓ Assigned admin role to admin user")
    else:
        print(f"  ✓ Admin role already assigned")
    
    print("\n✅ Default data setup completed!")
    print("\nSummary:")
    print(f"  Total Features: {Feature.objects.count()}")
    print(f"  Total Roles: {Role.objects.count()}")
    print(f"  Users with assigned roles: {UserRole.objects.filter(is_active=True).count()}")

if __name__ == '__main__':
    create_default_data()
