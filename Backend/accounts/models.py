from django.contrib.auth.models import AbstractUser,Group,Permission
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    payment_successful = models.BooleanField(default=False)
    
    # Add these to avoid clashes
    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_set",
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )
class UserApp(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    app_id = models.CharField(max_length=255)
    app_name = models.CharField(max_length=255)
    app_icon = models.URLField()
    publisher = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'app_id')  # Prevents duplicate apps per user

    def __str__(self):
        return f"{self.app_name} ({self.user.username})"
    
