#!/usr/bin/env python
import os
import sys
import django
import requests

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import Token

# Get test user
user = User.objects.first()
if not user:
    print("No user found. Creating one...")
    user = User.objects.create_user(username='testuser', password='testpass123')

# Get or create token
token = Token.objects.filter(user=user).first()
if not token:
    token_key = 'test_token_' + user.username
    token = Token.objects.create(user=user, key=token_key)

print(f"Test User: {user.username}")
print(f"Token: {token.key}")

# Test save draft API
headers = {
    'Authorization': f'Token {token.key}',
    'Content-Type': 'application/json'
}

draft_data = {
    'authority': 'RTA',
    'permit_type_id': None,
    'vehicle_number': 'TEST-123',
    'owner_name': 'Test Owner',
    'owner_email': 'test@example.com',
    'owner_phone': '03001234567',
}

url = 'http://localhost:8000/api/permits/save_draft/'

print(f"\nSending draft save request to {url}")
print(f"Headers: {headers}")
print(f"Data: {draft_data}")

try:
    response = requests.post(url, json=draft_data, headers=headers)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
