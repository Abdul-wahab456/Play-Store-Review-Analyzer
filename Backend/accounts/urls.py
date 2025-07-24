# Fixed urls.py with correct function names

from django.urls import path
from .views import (
    get_csrf_token,          # Fixed: function name corrected
    login_view,              # Fixed: function name corrected  
    payment_status_view,     # Fixed: function name corrected
    SignUpView,
    UpdatePaymentView,
    ValidatePaymentView,
    PlayStoreSearchView,
    UserAppsView,
    MainDashBoardView,
    SentimentalAnlysisView,
    FeatureAnalysisView,
)

urlpatterns = [
    # CSRF endpoint
    path('api/auth/csrf/', get_csrf_token, name='csrf_token'),
    
    # Authentication endpoints
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/signup/', SignUpView.as_view(), name='signup'),
    path('api/auth/payment-status/', payment_status_view, name='payment_status'),
    path('api/auth/update-payment/', UpdatePaymentView.as_view(), name='update_payment'),
    
    # Payment endpoints
    path('api/validate-payment/', ValidatePaymentView.as_view(), name='validate_payment'),
    
    # App management endpoints
    path('api/playstore/search/', PlayStoreSearchView.as_view(), name='playstore_search'),
    path('api/user/apps/', UserAppsView.as_view(), name='user_apps'),
    
    # Dashboard and analytics endpoints
    path('api/main/dashboard/', MainDashBoardView.as_view(), name='main_dashboard'),
    path('api/sentiment-analysis/', SentimentalAnlysisView.as_view(), name='sentiment_analysis'),
    path('api/feature-analysis/', FeatureAnalysisView.as_view(), name='feature_analysis'),
]