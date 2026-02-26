#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from permits.models import Feature

# List all existing features
features = Feature.objects.all()
print(f"=== EXISTING FEATURES ({features.count()}) ===\n")
for f in features:
    print(f"  {f.id}: {f.name}")
