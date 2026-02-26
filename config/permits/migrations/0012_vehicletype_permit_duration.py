# Generated migration for adding permit_duration_days field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('permits', '0011_permit_vehicle_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicletype',
            name='permit_duration_days',
            field=models.IntegerField(default=365, help_text='Default permit validity in days (365 = 1 year)'),
        ),
    ]
