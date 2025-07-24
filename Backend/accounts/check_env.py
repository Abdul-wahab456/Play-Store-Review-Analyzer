# Create this file: accounts/management/commands/check_env.py
# First create the directories if they don't exist:
# mkdir -p accounts/management/commands

from django.core.management.base import BaseCommand
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Check environment variable configuration'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Checking Environment Configuration...'))
        
        # Required environment variables
        required_vars = {
            'SECRET_KEY': getattr(settings, 'SECRET_KEY', None),
            'DEBUG': getattr(settings, 'DEBUG', None),
        }
        
        # Optional but recommended
        optional_vars = {
            'GOOGLE_PLAY_API_KEY': getattr(settings, 'GOOGLE_PLAY_API_KEY', None),
            'RAPID_API_KEY': getattr(settings, 'RAPID_API_KEY', None),
            'STRIPE_SECRET_KEY': getattr(settings, 'STRIPE_SECRET_KEY', None),
            'STRIPE_PUBLISHABLE_KEY': getattr(settings, 'STRIPE_PUBLISHABLE_KEY', None),
        }
        
        # Check required variables
        self.stdout.write('\n📋 Required Variables:')
        for var_name, value in required_vars.items():
            if value:
                self.stdout.write(f'  ✅ {var_name}: {"*" * 10}[hidden]')
            else:
                self.stdout.write(self.style.ERROR(f'  ❌ {var_name}: Not set'))
        
        # Check optional variables
        self.stdout.write('\n🔧 Optional Variables:')
        for var_name, value in optional_vars.items():
            if value:
                if 'your-' in str(value) or 'placeholder' in str(value):
                    self.stdout.write(self.style.WARNING(f'  ⚠️  {var_name}: Using placeholder value'))
                else:
                    self.stdout.write(f'  ✅ {var_name}: {"*" * 10}[hidden]')
            else:
                self.stdout.write(f'  ⭕ {var_name}: Not set (will use fallback)')
        
        # Check .env file
        env_file_path = os.path.join(settings.BASE_DIR, '.env')
        if os.path.exists(env_file_path):
            self.stdout.write(f'\n📄 Environment file found: {env_file_path}')
        else:
            self.stdout.write(self.style.WARNING('\n⚠️  No .env file found - using system environment variables'))
        
        # API functionality check
        self.stdout.write('\n🔌 API Functionality:')
        
        # Google Play Store search
        if getattr(settings, 'RAPID_API_KEY', None):
            self.stdout.write('  ✅ Google Play Store: RapidAPI configured')
        else:
            try:
                from google_play_scraper import search
                self.stdout.write('  ✅ Google Play Store: Using google_play_scraper library')
            except ImportError:
                self.stdout.write(self.style.WARNING('  ⚠️  Google Play Store: Will use mock data (install google-play-scraper for real data)'))
        
        # Payment processing
        if getattr(settings, 'STRIPE_SECRET_KEY', None):
            stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            if 'your-stripe-secret-key' in stripe_key:
                self.stdout.write(self.style.WARNING('  ⚠️  Payments: Stripe key is placeholder (payments will be simulated)'))
            else:
                self.stdout.write('  ✅ Payments: Stripe configured')
        else:
            self.stdout.write('  ⭕ Payments: Will simulate payments (no Stripe key)')
        
        # Security check
        self.stdout.write('\n🔒 Security:')
        if settings.DEBUG:
            self.stdout.write(self.style.WARNING('  ⚠️  DEBUG mode is enabled (disable in production)'))
        else:
            self.stdout.write('  ✅ DEBUG mode is disabled')
        
        secret_key = getattr(settings, 'SECRET_KEY', '')
        if 'django-insecure' in secret_key:
            self.stdout.write(self.style.WARNING('  ⚠️  Using Django default secret key (change in production)'))
        else:
            self.stdout.write('  ✅ Custom secret key configured')
        
        self.stdout.write(self.style.SUCCESS('\n✨ Environment check complete!'))
        
        # Recommendations
        self.stdout.write('\n💡 Recommendations:')
        
        if not getattr(settings, 'RAPID_API_KEY', None):
            try:
                from google_play_scraper import search
            except ImportError:
                self.stdout.write('  📦 Install google-play-scraper: pip install google-play-scraper')
        
        if not getattr(settings, 'STRIPE_SECRET_KEY', None):
            self.stdout.write('  💳 Get Stripe API keys from https://dashboard.stripe.com/apikeys')
        
        if getattr(settings, 'DEBUG', False):
            self.stdout.write('  🚀 Set DEBUG=False in production')
        
        self.stdout.write('\n🔗 Useful links:')
        self.stdout.write('  • RapidAPI Google Play Store: https://rapidapi.com/sixonesix/api/google-play-store-api/')
        self.stdout.write('  • Stripe Dashboard: https://dashboard.stripe.com/')
        self.stdout.write('  • Django Environment Variables: https://docs.djangoproject.com/en/stable/topics/settings/')