from django.core.management.base import BaseCommand
from permits.models import Role, Feature
from django.db import transaction


class Command(BaseCommand):
    help = 'Setup roles and features for the PTA_RTA system'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up roles and features...'))

        # Create or get features
        features_data = {
            'permit_view': 'View Permits',
            'permit_create': 'Create Permits',
            'permit_edit': 'Edit Permits',
            'permit_delete': 'Delete Permits',
            'permit_check': 'Check Permits',
            'permit_submit': 'Submit Permits',
            'permit_share': 'Share Permits',
            'permit_renew': 'Renew Permits',
            'permit_cancel': 'Cancel Permits',
            'user_manage': 'Manage Users',
            'role_manage': 'Manage Roles',
            'report_view': 'View Reports',
            'dashboard_view': 'View Dashboard',
        }

        features = {}
        for feature_name, feature_description in features_data.items():
            feature, created = Feature.objects.get_or_create(
                name=feature_name,
                defaults={'description': feature_description}
            )
            features[feature_name] = feature
            if created:
                self.stdout.write(f'✓ Created feature: {feature_name}')
            else:
                self.stdout.write(f'  Feature exists: {feature_name}')

        # Define roles with their features
        roles_data = {
            'admin': {
                'description': 'System Administrator - Full access to all features',
                'features': [
                    'permit_view', 'permit_create', 'permit_edit', 'permit_delete',
                    'permit_check', 'permit_submit', 'permit_share', 'permit_renew',
                    'permit_cancel', 'user_manage', 'role_manage', 'report_view',
                    'dashboard_view'
                ]
            },
            'end_user': {
                'description': 'End User - Can create, view, and update their own permits',
                'features': [
                    'permit_view', 'permit_create', 'permit_edit',
                    'permit_submit', 'permit_share', 'dashboard_view'
                ]
            },
            'operator': {
                'description': 'Operator - Can process and manage permits',
                'features': [
                    'permit_view', 'permit_edit', 'permit_check',
                    'permit_submit', 'permit_renew', 'permit_cancel',
                    'dashboard_view'
                ]
            },
            'supervisor': {
                'description': 'Supervisor - Can supervise and oversee permit operations',
                'features': [
                    'permit_view', 'permit_edit', 'permit_check', 'permit_submit',
                    'permit_renew', 'permit_cancel', 'report_view', 'dashboard_view'
                ]
            },
        }

        # Create or update roles
        for role_name, role_data in roles_data.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': role_data['description']}
            )

            # Add features to role
            role_features = [features[fname] for fname in role_data['features']]
            role.features.set(role_features)

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created role: {role_name}')
                )
            else:
                self.stdout.write(f'  Updated role: {role_name}')

            # Display role features
            feature_names = ', '.join([f.get_name_display() for f in role.features.all()])
            self.stdout.write(f'  Features: {feature_names}')

        self.stdout.write(self.style.SUCCESS('\n✓ Setup completed successfully!'))
        self.stdout.write('\nRole Summary:')
        self.stdout.write('  • admin - Full system access')
        self.stdout.write('  • end_user - Create and manage own permits')
        self.stdout.write('  • operator - Process and manage permits')
        self.stdout.write('  • supervisor - Oversee operations and view reports')
