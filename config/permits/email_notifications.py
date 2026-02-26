"""
Email notification service for permit system.
Handles sending emails for permit assignments and status changes.
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings


class NotificationEmailService:
    """Service class for sending notification emails"""

    @staticmethod
    def send_permit_assigned_email(user, permit, assigned_by):
        """
        Send email when a permit is assigned to a user.
        
        Args:
            user: User object to send email to
            permit: Permit object
            assigned_by: Name or username of who assigned the permit
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if not user or not user.email:
                return False
            
            subject = f"Permit Assigned: {permit.permit_number}"
            message = f"""
Dear {user.first_name or user.username},

A permit has been assigned to you.

Permit Details:
- Permit Number: {permit.permit_number}
- Vehicle Number: {permit.vehicle_number}
- Assigned By: {assigned_by}
- Assignment Date: {permit.updated_at.strftime('%Y-%m-%d %H:%M:%S') if permit.updated_at else 'N/A'}

Please log in to the system to view the full details.

Best regards,
PTA-RTA Management System
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            print(f"[EMAIL] Permit assigned email sent to {user.email}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to send permit assigned email: {str(e)}")
            return False

    @staticmethod
    def send_permit_status_changed_email(user, permit, old_status, new_status, changed_by):
        """
        Send email when permit status changes.
        
        Args:
            user: User object to send email to (None if sending to owner email)
            permit: Permit object
            old_status: Previous status
            new_status: New status
            changed_by: Name or username of who made the change
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Determine recipient email
            recipient_email = None
            recipient_name = "User"
            
            if user:
                recipient_email = user.email
                recipient_name = user.first_name or user.username
            elif permit.owner_email:
                recipient_email = permit.owner_email
                recipient_name = permit.owner_name or "Permit Owner"
            else:
                return False
            
            if not recipient_email:
                return False
            
            subject = f"Permit Status Changed: {permit.permit_number}"
            message = f"""
Dear {recipient_name},

The status of a permit has been updated.

Permit Details:
- Permit Number: {permit.permit_number}
- Vehicle Number: {permit.vehicle_number}
- Previous Status: {old_status}
- New Status: {new_status}
- Changed By: {changed_by}
- Change Date: {permit.updated_at.strftime('%Y-%m-%d %H:%M:%S') if permit.updated_at else 'N/A'}

Please log in to the system to view the full details.

Best regards,
PTA-RTA Management System
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            
            print(f"[EMAIL] Status changed email sent to {recipient_email}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to send permit status changed email: {str(e)}")
            return False
