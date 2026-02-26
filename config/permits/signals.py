from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Permit, PermitHistory, Notification
from .email_notifications import NotificationEmailService

# Store previous permit states for comparison
_permit_initial_state = {}


@receiver(pre_save, sender=Permit)
def store_permit_initial_state(sender, instance, **kwargs):
    """
    Store the initial state of permit before saving to compare in post_save signal.
    This allows us to properly detect what changed.
    """
    if instance.pk:
        try:
            old_instance = Permit.objects.get(pk=instance.pk)
            _permit_initial_state[instance.pk] = {
                'status': old_instance.status,
                'assigned_to': old_instance.assigned_to,
            }
        except Permit.DoesNotExist:
            pass


@receiver(post_save, sender=Permit)
def create_permit_history_on_creation(sender, instance, created, **kwargs):
    """
    Create a history record when a permit is first created
    """
    if created:
        # Only create history if it doesn't already exist
        if not PermitHistory.objects.filter(permit=instance, action='created').exists():
            PermitHistory.objects.create(
                permit=instance,
                action='created',
                performed_by=instance.created_by or 'System',
                notes='Permit created',
                changes={}
            )


@receiver(post_save, sender=Permit)
def send_notification_on_permit_assignment(sender, instance, created, update_fields, **kwargs):
    """
    Send notification and email when a permit is assigned to a user.
    Triggered when assigned_to field is set or updated.
    """
    # Only handle updates (not creation), and check if assigned_to was modified
    if not created and update_fields and 'assigned_to' in update_fields:
        # Check if a user is being assigned to this permit
        if instance.assigned_to:
            user = instance.assigned_to
            assigned_by = instance.assigned_by or 'System'
            
            # Create in-app notification
            notification = Notification.objects.create(
                user=user,
                notification_type='permit_assigned',
                title=f"Permit Assigned: {instance.permit_number}",
                message=f"A permit ({instance.permit_number}) for vehicle {instance.vehicle_number} has been assigned to you.",
                permit=instance,
                action_url=f"/permits/{instance.id}"
            )
            
            # Send email notification
            email_sent = NotificationEmailService.send_permit_assigned_email(
                user=user,
                permit=instance,
                assigned_by=assigned_by
            )
            
            # Update notification with email sent status
            notification.email_sent = email_sent
            notification.email_sent_at = timezone.now() if email_sent else None
            notification.save(update_fields=['email_sent', 'email_sent_at'])
            
            print(f"[NOTIFICATION] Permit {instance.permit_number} assigned to {user.username}")
            print(f"[EMAIL] Email notification sent: {email_sent}")


@receiver(post_save, sender=Permit)
def send_notification_on_status_change(sender, instance, created, **kwargs):
    """
    Send notification and email when permit status changes.
    Notifies both the assigned user and the permit owner.
    """
    if created:
        return  # Skip creation
    
    try:
        # Get the old status from our stored state
        old_state = _permit_initial_state.get(instance.pk, {})
        old_status = old_state.get('status')
        new_status = instance.status
        
        # Skip if status didn't actually change
        if old_status is None or old_status == new_status:
            # Clean up the stored state
            if instance.pk in _permit_initial_state:
                del _permit_initial_state[instance.pk]
            return
        
        changed_by = instance.updated_by or 'System'
        
        print(f"[STATUS_CHANGE] Permit {instance.permit_number}: {old_status} → {new_status}")
        
        # 1. Send notification to assigned user (if any)
        if instance.assigned_to:
            user = instance.assigned_to
            notification = Notification.objects.create(
                user=user,
                notification_type='permit_status_changed',
                title=f"Permit Status Changed: {instance.permit_number}",
                message=f"Permit {instance.permit_number} status changed from {old_status} to {new_status}.",
                permit=instance,
                action_url=f"/permits/{instance.id}"
            )
            
            # Send email to assigned user
            email_sent = NotificationEmailService.send_permit_status_changed_email(
                user=user,
                permit=instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by
            )
            
            notification.email_sent = email_sent
            notification.email_sent_at = timezone.now() if email_sent else None
            notification.save(update_fields=['email_sent', 'email_sent_at'])
            
            print(f"[NOTIFICATION] Status change notification sent to assigned user {user.username}")
        
        # 2. Send email to permit owner (if owner_email exists)
        if instance.owner_email:
            email_sent = NotificationEmailService.send_permit_status_changed_email(
                user=None,  # Owner is not a User object
                permit=instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by
            )
            print(f"[EMAIL] Status change email sent to owner {instance.owner_email}: {email_sent}")
        
        # Clean up the stored state
        if instance.pk in _permit_initial_state:
            del _permit_initial_state[instance.pk]
    
    except Exception as e:
        print(f"[ERROR] Failed to send status change notification: {str(e)}")
        import traceback
        traceback.print_exc()
