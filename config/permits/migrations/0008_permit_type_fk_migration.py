# Generated migration for permit_type ForeignKey migration
# This handles converting from CharField to ForeignKey

from django.db import migrations, models
import django.db.models.deletion


def create_and_link_permit_types(apps, schema_editor):
    """Create PermitType references and link them"""
    Permit = apps.get_model('permits', 'Permit')
    PermitType = apps.get_model('permits', 'PermitType')
    
    # Get all permits with old string type values
    type_mapping = {
        'transport': 'Transport',
        'goods': 'Goods',
        'passenger': 'Passenger',
        'commercial': 'Commercial',
    }
    
    for old_val, type_name in type_mapping.items():
        try:
            permit_type_obj = PermitType.objects.get(name=type_name)
            # Use raw SQL update since we're changing the column type
            schema_editor.execute(
                f"UPDATE permits_permit SET permit_type_id = {permit_type_obj.id} WHERE permit_type = '{old_val}'"
            )
            print(f"Linked permits with type '{old_val}' to {type_name} (id={permit_type_obj.id})")
        except PermitType.DoesNotExist:
            print(f"Warning: PermitType '{type_name}' not found")


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('permits', '0007_permittype_vehicletype'),
    ]

    operations = [
        # Step 1: Add new permit_type_id field temporarily
        migrations.AddField(
            model_name='permit',
            name='permit_type_id',
            field=models.BigIntegerField(null=True, blank=True),
        ),
        # Step 2: Run data migration
        migrations.RunPython(create_and_link_permit_types, reverse_func),
        # Step 3: Remove old varchar field
        migrations.RemoveField(
            model_name='permit',
            name='permit_type',
        ),
        # Step 4: Rename permit_type_id to permit_type
        migrations.RenameField(
            model_name='permit',
            old_name='permit_type_id',
            new_name='permit_type',
        ),
        # Step 5: Alter the field to be a proper FK
        migrations.AlterField(
            model_name='permit',
            name='permit_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='permits', to='permits.permittype'),
        ),
    ]
