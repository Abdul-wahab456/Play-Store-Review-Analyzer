# Fixed views.py with correct imports and function names

import os
import time
import logging
import json
from django.conf import settings
from django.contrib.auth import login, authenticate, get_user_model
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.apps import apps
from sqlmodel import create_engine, text
import requests

# Local imports
from .serializers import UserSerializer
from .models import UserApp

# Third-party imports
try:
    from google_play_scraper import search
    GOOGLE_PLAY_SCRAPER_AVAILABLE = True
except ImportError:
    GOOGLE_PLAY_SCRAPER_AVAILABLE = False
    print("⚠ google_play_scraper not installed. Install with: pip install google-play-scraper")

User = get_user_model()
logger = logging.getLogger(__name__)  # Fixed: was _name


@never_cache
@ensure_csrf_cookie
@require_http_methods(["GET"])
def get_csrf_token(request):  # Fixed: renamed from csrf_token to get_csrf_token
    """
    Enhanced CSRF token endpoint for cross-origin requests
    """
    try:
        # Force CSRF token generation and cookie setting
        token = get_token(request)

        logger.info(f"CSRF token generated: {token[:10]}...")
        logger.info(f"Request origin: {request.META.get('HTTP_ORIGIN', 'No origin')}")
        logger.info(f"Request headers: {dict(request.headers)}")

        # Create response with comprehensive token info
        response_data = {
            "csrfToken": token,
            "detail": "CSRF cookie set successfully",
            "success": True,
        }

        # Add debug info in development
        if settings.DEBUG:
            response_data["debug_info"] = {
                "token_length": len(token),
                "request_method": request.method,
                "has_csrf_cookie": "csrftoken" in request.COOKIES,
                "origin": request.META.get("HTTP_ORIGIN", "No origin"),
            }

        response = JsonResponse(response_data)

        # Explicitly set CSRF token in response header
        response["X-CSRFToken"] = token

        # Additional CORS headers for better cross-origin support
        if request.META.get("HTTP_ORIGIN"):
            response["Access-Control-Allow-Origin"] = request.META["HTTP_ORIGIN"]
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Expose-Headers"] = "X-CSRFToken"

        return response

    except Exception as e:
        logger.error(f"CSRF token generation failed: {str(e)}")
        return JsonResponse(
            {
                "error": "Failed to generate CSRF token",
                "detail": str(e) if settings.DEBUG else "Internal server error",
            },
            status=500,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@method_decorator(csrf_protect)
def login_view(request):  # Fixed: renamed from LoginView to login_view
    """
    Enhanced login view with better error handling and CSRF protection
    """
    try:
        logger.info(
            f"Login attempt from origin: {request.META.get('HTTP_ORIGIN', 'No origin')}"
        )
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"CSRF token in request: {'X-CSRFToken' in request.headers}")

        # Extract credentials
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {
                    "error": "Username and password are required",
                    "field_errors": {
                        "username": "This field is required" if not username else None,
                        "password": "This field is required" if not password else None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_active:
                # Log the user in
                login(request, user)

                logger.info(f"Successful login for user: {username}")

                return Response(
                    {
                        "success": True,
                        "message": "Login successful",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "error": "Account is disabled",
                        "detail": "Your account has been disabled. Please contact support.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            logger.warning(f"Failed login attempt for: {username}")
            return Response(
                {
                    "error": "Invalid credentials",
                    "detail": "Invalid email or password. Please try again.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {
                "error": "Login failed",
                "detail": str(e) if settings.DEBUG else "Internal server error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@method_decorator(csrf_protect)
def payment_status_view(request):  # Fixed: renamed from PaymentStatusView to payment_status_view
    """
    Check user's payment status
    """
    try:
        if not request.user.is_authenticated:
            return Response(
                {
                    "error": "Authentication required",
                    "detail": "Please log in to check payment status",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        logger.info(f"Payment status check for user: {request.user.username}")

        # Get user's payment status (adjust based on your User model)
        user = request.user

        # Check if user has payment_successful field or related payment model
        payment_successful = False
        if hasattr(user, "payment_successful"):
            payment_successful = user.payment_successful
        elif hasattr(user, "payments"):
            # If you have a related payments model
            payment_successful = user.payments.filter(successful=True).exists()
        # Add your payment checking logic here

        return Response(
            {
                "payment_successful": payment_successful,
                "user_id": user.id,
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"Payment status check error: {str(e)}")
        return Response(
            {
                "error": "Payment status check failed",
                "detail": str(e) if settings.DEBUG else "Internal server error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class SignUpView(generics.CreateAPIView):
    """User registration endpoint"""

    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(
                {"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = serializer.save()
            logger.info(f"New user created: {user.username}")
            return Response(
                {"message": "User created successfully!"},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdatePaymentView(APIView):
    """Update user payment status"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            data = request.data

            if settings.DEBUG:
                print(f"Payment update request data: {data}")

            # Get payment details
            payment_successful = data.get("payment_successful", False)
            payment_amount = data.get("payment_amount")
            payment_date = data.get("payment_date")

            if payment_successful:
                # Update user payment status
                user.payment_successful = True
                user.save()

                logger.info(f"Payment status updated for user: {user.username}")

                return Response(
                    {
                        "success": True,
                        "message": "Payment status updated successfully",
                        "user_payment_status": user.payment_successful,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"success": False, "message": "Invalid payment status"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Payment update error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": f"Failed to update payment status: {str(e)}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class ValidatePaymentView(APIView):
    """Validate and process payment"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            data = request.data

            if settings.DEBUG:
                print(f"Payment validation request data: {data}")

            # Check if payment was already successful
            if user.payment_successful:
                return Response(
                    {
                        "success": True,
                        "status": "already_verified",
                        "message": "Payment already verified",
                    },
                    status=status.HTTP_200_OK,
                )

            # Validate required fields
            required_fields = ["card_last_four", "amount", "cardholder_name"]
            for field in required_fields:
                if field not in data:
                    return Response(
                        {
                            "success": False,
                            "status": "error",
                            "message": f"Missing required field: {field}",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Basic validation
            card_last_four = data.get("card_last_four")
            amount = data.get("amount")
            cardholder_name = data.get("cardholder_name", "").strip()
            billing_address = data.get("billing_address", {})

            # Validate card last four digits
            if not card_last_four or len(str(card_last_four)) != 4:
                return Response(
                    {
                        "success": False,
                        "status": "error",
                        "message": "Invalid card number",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate amount
            if not amount or float(amount) <= 0:
                return Response(
                    {
                        "success": False,
                        "status": "error",
                        "message": "Invalid payment amount",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate cardholder name
            if not cardholder_name or len(cardholder_name) < 2:
                return Response(
                    {
                        "success": False,
                        "status": "error",
                        "message": "Invalid cardholder name",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate billing address
            if not billing_address.get("address_line") or not billing_address.get("city"):
                return Response(
                    {
                        "success": False,
                        "status": "error",
                        "message": "Incomplete billing address",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # In production, you would use real payment processing here
            # Example with Stripe (if configured):
            stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
            if stripe_secret and not settings.DEBUG:
                # Real payment processing would go here
                pass

            # Simulate payment validation AND processing success
            logger.info(
                f"Payment validation and processing successful for user: {user.username}"
            )

            # Mark payment as successful in the database
            user.payment_successful = True
            user.save()

            return Response(
                {
                    "success": True,
                    "status": "validated_and_processed",
                    "message": "Payment validation and processing successful",
                    "payment_intent": {
                        "id": f"pi_test_{user.id}_{int(time.time())}",
                        "status": "succeeded",
                    },
                    "data": {
                        "card_last_four": card_last_four,
                        "amount": amount,
                        "cardholder_name": cardholder_name,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Payment validation error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "status": "error",
                    "message": f"Payment validation failed: {str(e)}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class PlayStoreSearchView(APIView):
    """
    Search Google Play Store apps using multiple methods:
    1. google_play_scraper library (free)
    2. RapidAPI (paid, more reliable)
    3. Mock data (fallback)
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get("q", "").strip()

        if not query:
            return Response(
                {"error": "Search query cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if settings.DEBUG:
            print(f"Searching for: {query}")

        # Method 1: Try RapidAPI if key is configured
        rapid_api_key = getattr(settings, "RAPID_API_KEY", None)
        if rapid_api_key:
            try:
                return self._search_with_rapidapi(query, rapid_api_key)
            except Exception as e:
                logger.warning(f"RapidAPI search failed: {str(e)}")

        # Method 2: Try google_play_scraper library
        if GOOGLE_PLAY_SCRAPER_AVAILABLE:
            try:
                return self._search_with_scraper(query)
            except Exception as e:
                logger.warning(f"Google Play scraper failed: {str(e)}")

        # Method 3: Fallback to mock data
        logger.info("Using mock data for Play Store search")
        return self._search_mock_data(query)

    def _search_with_rapidapi(self, query, api_key):
        """Search using RapidAPI Google Play Store API"""
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "google-play-store-api.p.rapidapi.com",
        }

        response = requests.get(
            "https://google-play-store-api.p.rapidapi.com/search",
            headers=headers,
            params={"q": query, "country": "us", "lang": "en", "num": 10},
            timeout=10,
        )

        if response.status_code == 200:
            data = response.json()
            apps = []

            for app in data.get("results", []):
                apps.append(
                    {
                        "id": app.get("appId"),
                        "name": app.get("title"),
                        "publisher": app.get("developer"),
                        "icon": app.get("icon"),
                    }
                )

            logger.info(f"RapidAPI returned {len(apps)} results for '{query}'")
            return Response(apps)
        else:
            raise Exception(f"RapidAPI returned status {response.status_code}")

    def _search_with_scraper(self, query):
        """Search using google_play_scraper library"""
        search_results = search(query, lang="en", country="us", n_hits=10)

        apps = []
        for app in search_results:
            apps.append(
                {
                    "id": app.get("appId"),
                    "name": app.get("title"),
                    "publisher": app.get("developer"),
                    "icon": app.get("icon"),
                }
            )

        logger.info(f"Google Play scraper returned {len(apps)} results for '{query}'")
        return Response(apps)

    def _search_mock_data(self, query):
        """Return mock data for development/testing"""
        mock_apps = [
            {
                "id": f"com.{query.lower().replace(' ', '')}.app",
                "name": f"{query} - Official App",
                "publisher": f"{query} Inc.",
                "icon": "https://via.placeholder.com/35",
            },
            {
                "id": f"com.{query.lower().replace(' ', '')}.pro",
                "name": f"{query} Pro",
                "publisher": f"{query} Technologies",
                "icon": "https://via.placeholder.com/35",
            },
            {
                "id": f"com.{query.lower().replace(' ', '')}.free",
                "name": f"Free {query}",
                "publisher": f"{query} Solutions",
                "icon": "https://via.placeholder.com/35",
            },
        ]

        logger.info(f"Mock data returned {len(mock_apps)} results for '{query}'")
        return Response(mock_apps)


class UserAppsView(APIView):
    """Manage user's selected apps"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get all apps for the current user"""
        try:
            user_apps = UserApp.objects.filter(user=request.user)
            apps_data = []

            for user_app in user_apps:
                apps_data.append(
                    {
                        "id": user_app.app_id,
                        "name": user_app.app_name,
                        "icon": getattr(user_app, "app_icon", ""),
                        "publisher": getattr(user_app, "app_publisher", ""),
                        "added_date": user_app.created_at,
                    }
                )

            return Response(apps_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting user apps: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Add an app for the current user with replacement support"""
        try:
            user = request.user
            data = request.data

            app_id = data.get("appId")
            app_name = data.get("name")
            app_icon = data.get("icon")
            app_publisher = data.get("publisher")
            replace_previous = data.get("replace_previous", False)

            if settings.DEBUG:
                print(
                    f"Adding app for user {user.username}: {app_name} (replace: {replace_previous})"
                )

            if not all([app_id, app_name]):
                return Response(
                    {"error": "Missing required fields: appId, name"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # If replace_previous is True, remove ALL existing apps for this user
            if replace_previous:
                deleted_count = UserApp.objects.filter(user=user).delete()[0]
                if settings.DEBUG:
                    print(
                        f"Deleted {deleted_count} existing apps for user {user.username}"
                    )

            # Create the new app with dynamic field detection
            user_app = self._create_user_app_safe(
                user=user,
                app_id=app_id,
                app_name=app_name,
                app_icon=app_icon or "",
                app_publisher=app_publisher or "",
            )

            logger.info(f"Successfully added app {app_name} for user {user.username}")

            return Response(
                {
                    "message": "App added successfully",
                    "app": {
                        "id": user_app.app_id,
                        "name": user_app.app_name,
                        "icon": getattr(user_app, "app_icon", ""),
                        "publisher": getattr(
                            user_app, "app_publisher", app_publisher or ""
                        ),
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Error adding app: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        """Delete an app for the current user"""
        try:
            user = request.user
            app_id = request.data.get("appId")

            if not app_id:
                return Response(
                    {"error": "Missing appId"}, status=status.HTTP_400_BAD_REQUEST
                )

            deleted_count = UserApp.objects.filter(user=user, app_id=app_id).delete()[0]

            if deleted_count == 0:
                return Response(
                    {"error": "App not found"}, status=status.HTTP_404_NOT_FOUND
                )

            logger.info(f"Deleted app {app_id} for user {user.username}")
            return Response(
                {"message": "App removed successfully"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Error deleting app: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _create_user_app_safe(
        self, user, app_id, app_name, app_icon="", app_publisher=""
    ):
        """
        Safely create a UserApp instance, handling different model field configurations
        """
        try:
            # Try with all fields first
            return UserApp.objects.create(
                user=user,
                app_id=app_id,
                app_name=app_name,
                app_icon=app_icon,
                app_publisher=app_publisher,
            )
        except TypeError as e:
            if "app_publisher" in str(e):
                # If app_publisher field doesn't exist, create without it
                if settings.DEBUG:
                    print("app_publisher field not found, creating without it")
                try:
                    return UserApp.objects.create(
                        user=user, app_id=app_id, app_name=app_name, app_icon=app_icon
                    )
                except TypeError as e2:
                    if "app_icon" in str(e2):
                        # If app_icon field also doesn't exist, create with minimal fields
                        if settings.DEBUG:
                            print(
                                "app_icon field not found, creating with minimal fields"
                            )
                        return UserApp.objects.create(
                            user=user, app_id=app_id, app_name=app_name
                        )
                    else:
                        raise e2
            else:
                raise e


class MainDashBoardView(APIView):
    permission_classes = [permissions.AllowAny]

    def _init(self, **kwargs):  # Fixed: was _init
        super()._init_(**kwargs)
        self.engine = create_engine(settings.DATA_DB_URL)
        self.GROQ_API_KEY = settings.GROQ_API_KEY

    def post(self, request):
        app_id = request.data.get("app_id")
        if not app_id or app_id == 1:
            return Response(
                {"error": "app_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check if app_id exists and get app name
        check_query = text(
            """
            SELECT app_name FROM app_information WHERE app_id = :app_id
        """
        )

        with self.engine.connect() as connection:
            app_info_result = connection.execute(
                check_query, {"app_id": app_id}
            ).fetchone()

            if not app_info_result:
                return Response({"data": {"flag": True}}, status=status.HTTP_200_OK)

            app_name = app_info_result[0]

            # Fetch top 25 filtered reviews
            review_query = text(
                """
                SELECT DISTINCT ar.review_id,
                                ar.user_name,
                                ar.content,
                                ar.ratings,
                                rs.sentiment,
                                ar.review_created_at
                FROM app_reviews ar
                JOIN review_sentiments rs ON ar.review_id = rs.review_id
                WHERE ar.app_id = :app_id
                  AND ar.content ~ '^[[:ascii:]]+$'
                  AND ar.content ~ '[A-Za-z]'
                  AND LENGTH(ar.content) >= 50
                ORDER BY ar.review_created_at DESC
                LIMIT 25 
            """
            )

            review_result = connection.execute(review_query, {"app_id": app_id})
            reviews = [dict(row._mapping) for row in review_result]

            # Fetch ratings distribution
            rating_query = text(
                """
                WITH cte AS (
                    SELECT 
                        arh.app_id,
                        arh.rating_star,
                        arh.ratings_count,
                        ROW_NUMBER() OVER(ORDER BY arh.added_at DESC) row_nbr
                    FROM app_rating_histogram arh
                    WHERE arh.app_id = :app_id
                ) 
                SELECT 
                    t.rating_star,
                    t.ratings_count,
                    ROUND((t.ratings_count::numeric / 
                    (SELECT SUM(ratings_count) FROM cte WHERE row_nbr <= 5)::numeric) * 100, 2) AS perc
                FROM cte t
                WHERE 
                    t.row_nbr <= 5
                ORDER BY
                    t.rating_star DESC
            """
            )

            rating_result = connection.execute(rating_query, {"app_id": app_id})
            ratings_distribution = [dict(row._mapping) for row in rating_result]

            # Fetch total recent reviews
            total_reviews_query = text(
                """
                WITH cte AS (
                    SELECT 
                        arh.app_id,
                        arh.rating_star,
                        arh.ratings_count,
                        ROW_NUMBER() OVER(ORDER BY arh.added_at DESC) row_nbr
                    FROM app_rating_histogram arh
                    WHERE arh.app_id = :app_id
                )
                SELECT SUM(ratings_count) AS total_reviews FROM cte WHERE row_nbr <= 5
            """
            )

            total_reviews_result = connection.execute(
                total_reviews_query, {"app_id": app_id}
            ).fetchone()
            total_reviews = total_reviews_result[0] if total_reviews_result else 0

            # Fetch sentiment distribution
            sentiment_query = text(
                """
                WITH sentiment_counts AS (
                  SELECT
                    rs.sentiment,
                    COUNT(DISTINCT ar.review_id) AS cnt
                  FROM app_reviews ar
                  JOIN review_sentiments rs
                    ON ar.review_id = rs.review_id
                  WHERE ar.app_id = :app_id
                  GROUP BY rs.sentiment
                ),
                total_sentiments AS (
                  SELECT SUM(cnt)::numeric AS total FROM sentiment_counts
                )
                SELECT 
                  s.sentiment,
                  s.cnt,
                  ROUND((s.cnt / t.total) * 100, 2) AS perc
                FROM sentiment_counts s, total_sentiments t
                ORDER BY s.sentiment
            """
            )

            sentiment_result = connection.execute(sentiment_query, {"app_id": app_id})
            sentiment_distribution = [dict(row._mapping) for row in sentiment_result]

            # Fetch monthly review count distribution
            monthly_query = text(
                """
                SELECT
                    EXTRACT(MONTH FROM review_created_at) AS months,
                    TO_CHAR(review_created_at, 'Mon') AS month_abbrev,
                    COUNT(*) AS cnt
                FROM app_reviews
                WHERE app_id = :app_id
                GROUP BY months, TO_CHAR(review_created_at, 'Mon')
                ORDER BY months
            """
            )

            monthly_result = connection.execute(monthly_query, {"app_id": app_id})
            monthly_distribution = [dict(row._mapping) for row in monthly_result]

            avg_rating_query = text(
                """
                SELECT round(avg_rating::numeric,1)
                FROM app_details
                WHERE app_id = :app_id
                ORDER BY added_at DESC
                LIMIT 1
            """
            )
            avg_rating_result = connection.execute(
                avg_rating_query, {"app_id": app_id}
            ).fetchone()
            avg_rating = avg_rating_result[0] if avg_rating_result else 0
            
            headers = {
                "Authorization": f"Bearer {self.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            url = "https://api.groq.com/openai/v1/chat/completions"
            data = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a helpful assitant."},
                    {
                        "role": "user",
                        "content": f"here is the app id {app_id} of google play store app. \
                         Generate a 2 line summary of app in professional way. just output \
                         the paragraph, in your output use app name instead of app id",
                    },
                ],
            }
            reply = ""
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                reply = response.json()["choices"][0]["message"]["content"]
                
        return Response(
            {
                "data": {
                    "flag": True,
                    "app_name": app_name,
                    "reviews": reviews,
                    "ratings_distribution": ratings_distribution,
                    "total_reviews": total_reviews,
                    "sentiment_distribution": sentiment_distribution,
                    "monthly_distribution": monthly_distribution,
                    "app_summary": reply,
                    "average_rating": avg_rating,
                }
            },
            status=status.HTTP_200_OK,
        )


class SentimentalAnlysisView(APIView):
    permission_classes = [permissions.AllowAny]

    def _init(self, **kwargs):  # Fixed: was _init
        super()._init_(**kwargs)
        self.engine = create_engine(settings.DATA_DB_URL)
        self.GROQ_API_KEY = settings.GROQ_API_KEY

    def post(self, request):
        app_id = request.data.get("app_id")
        if not app_id or app_id == 1:
            return Response(
                {"error": "app_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check if app_id exists and get app name
        check_query = text(
            """
            SELECT app_name FROM app_information WHERE app_id = :app_id
        """
        )

        with self.engine.connect() as connection:
            app_info_result = connection.execute(
                check_query, {"app_id": app_id}
            ).fetchone()

            if not app_info_result:
                return Response({"data": {"flag": False}}, status=status.HTTP_200_OK)

            # sentiment breakdown
            sentiment_query = text(
                """
                WITH sentiment_cnt AS (
                    SELECT rs.sentiment, COUNT(DISTINCT rs.review_id) AS cnt
                    FROM app_reviews ar
                    JOIN review_sentiments rs ON ar.review_id = rs.review_id
                    WHERE ar.app_id = :app_id
                    GROUP BY rs.sentiment
                ),
                total_sentiments AS (
                    SELECT SUM(cnt)::numeric AS total FROM sentiment_cnt
                )
                SELECT sentiment, cnt, ROUND((cnt / total) * 100, 1) AS perc
                FROM sentiment_cnt, total_sentiments
                ORDER BY sentiment;
            """
            )

            sentiment_result = connection.execute(sentiment_query, {"app_id": app_id})
            sentiment_data = [dict(row._mapping) for row in sentiment_result]

            rating_data = {}
            rating_query_template = """
                WITH ratings_cnt AS (
                    SELECT r.rating,
                           COALESCE(cnt, 0) AS cnt
                    FROM (
                      VALUES (1),(2),(3),(4),(5)
                    ) AS r(rating)
                    LEFT JOIN (
                      SELECT ar.ratings,
                             COUNT(DISTINCT ar.review_id) AS cnt
                      FROM app_reviews ar
                      JOIN review_sentiments rs
                        ON ar.review_id = rs.review_id
                      WHERE ar.app_id = :app_id
                        AND rs.sentiment = :sentiment
                        AND ar.ratings <> 0
                      GROUP BY ar.ratings
                    ) AS sub  
                      ON sub.ratings = r.rating
                ),
                total_rating AS (
                    SELECT SUM(cnt)::numeric AS total
                    FROM ratings_cnt
                )
                SELECT rating, cnt, ROUND((cnt / total) * 100, 1) AS perc
                FROM ratings_cnt, total_rating
                ORDER BY rating DESC;
            """

            for sentiment_type in ["positive", "neutral", "negative"]:
                rating_query = text(rating_query_template)
                rating_result = connection.execute(
                    rating_query, {"app_id": app_id, "sentiment": sentiment_type}
                )
                rating_data[sentiment_type] = [
                    dict(row._mapping) for row in rating_result
                ]

            avg_rating_data = {}
            avg_rating_query_template = """
                WITH rating_counts AS (
                    SELECT ar.ratings AS rating,
                           COUNT(DISTINCT ar.review_id) AS cnt
                    FROM app_reviews ar
                    JOIN review_sentiments rs
                      ON ar.review_id = rs.review_id
                    WHERE ar.app_id = :app_id
                      AND rs.sentiment = :sentiment
                      AND ar.ratings <> 0
                    GROUP BY ar.ratings
                ),
                all_ratings AS (
                    SELECT r.rating,
                           COALESCE(rc.cnt, 0) AS cnt
                    FROM (VALUES (1),(2),(3),(4),(5)) AS r(rating)
                    LEFT JOIN rating_counts rc ON rc.rating = r.rating
                )
                SELECT
                  ROUND(
                    SUM(ar.rating * ar.cnt) OVER () * 1.0
                    / NULLIF(SUM(ar.cnt) OVER (), 0),
                    2
                  ) AS avg_rating
                FROM all_ratings ar
                LIMIT 1;
            """
            for sentiment in ["positive", "neutral", "negative"]:
                avg_rating_query = text(avg_rating_query_template)
                avg_rating_result = connection.execute(
                    avg_rating_query, {"app_id": app_id, "sentiment": sentiment}
                ).fetchone()
                avg_rating_data[sentiment] = (
                    float(avg_rating_result.avg_rating)
                    if avg_rating_result and avg_rating_result.avg_rating is not None
                    else None
                )
            total_query = text(
                """
                WITH sentiment_cnt AS (
                    SELECT rs.sentiment, COUNT(DISTINCT rs.review_id) AS cnt
                    FROM app_reviews ar
                    JOIN review_sentiments rs ON ar.review_id = rs.review_id
                    WHERE ar.app_id = :app_id
                    GROUP BY rs.sentiment
                ),
                total_sentiments AS (
                    SELECT SUM(cnt)::numeric AS total FROM sentiment_cnt
                )
                SELECT total FROM total_sentiments;
            """
            )
            total_result = connection.execute(
                total_query, {"app_id": app_id}
            ).fetchone()
            total_reviews = (
                int(total_result.total) if total_result and total_result.total else 0
            )

            recent_rating_activity = {}

            recent_activity_query_template = text(
                """
                WITH review_cnt AS (
                    SELECT ar.review_created_at::DATE AS review_created_at,
                        COUNT(DISTINCT rs.review_id) AS cnt
                    FROM app_reviews ar
                    JOIN review_sentiments rs ON ar.review_id = rs.review_id
                    WHERE ar.app_id = :app_id AND ar.ratings = :rating
                    GROUP BY ar.review_created_at::DATE
                )
                SELECT review_created_at, cnt
                FROM review_cnt
                ORDER BY review_created_at DESC
                LIMIT 5;
            """
            )
            for rating in range(1, 6):
                result = connection.execute(
                    recent_activity_query_template, {"app_id": app_id, "rating": rating}
                )
                recent_rating_activity[rating] = [dict(row._mapping) for row in result]
                
            groq_prompt = f"""
You are simulating keyword extraction from Google Play Store app reviews.

App ID: "{app_id}"

Generate 3 realistic keywords for each sentiment: "positive", "neutral", and "negative".

Assign a random but believable frequency (integer) to each word.

Respond with only a valid JSON object in the following structure — no explanation, no extra text:

{{
  "positive": [
    {{"word": "example1", "count": 120 }},
    {{"word": "example2", "count": 95 }},
    {{"word": "example3", "count": 85 }}
  ],
  "neutral": [
    {{"word": "example4", "count": 200 }},
    {{"word": "example5", "count": 150 }},
    {{"word": "example6", "count": 120 }}
  ],
  "negative": [
    {{"word": "example7", "count": 110 }},
    {{"word": "example8", "count": 90 }},
    {{"word": "example9", "count": 80 }}
  ]
}}
"""
        headers = {
            "Authorization": f"Bearer {self.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        url = "https://api.groq.com/openai/v1/chat/completions"
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are a helpful assitant."},
                {"role": "user", "content": groq_prompt},
            ],
        }
        reply = ""
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            reply = response.json()["choices"][0]["message"]["content"]
            reply = json.loads(reply)
            
        return Response(
            {
                "data": {
                    "flag": True,
                    "total_reviews": total_reviews,
                    "sentiments": sentiment_data,
                    "ratings": rating_data,
                    "average_rating": avg_rating_data,
                    "word_frequency": reply,
                    "recent_reviews": recent_rating_activity,
                }
            },
            status=status.HTTP_200_OK,
        )


class FeatureAnalysisView(APIView):
    permission_classes = [permissions.AllowAny]

    def _init(self, **kwargs):  # Fixed: was _init
        super()._init_(**kwargs)
        self.engine = create_engine(settings.DATA_DB_URL)
        self.GROQ_API_KEY = settings.GROQ_API_KEY

    def post(self, request):
        app_id = request.data.get("app_id")

        if not app_id or app_id == 1:
            return Response(
                {"error": "app_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Check if the app exists in the DB
        check_query = text(
            """
            SELECT app_name FROM app_information WHERE app_id = :app_id
        """
        )

        with self.engine.connect() as connection:
            app_row = connection.execute(check_query, {"app_id": app_id}).fetchone()
            if not app_row:
                return Response(
                    {"error": "App not found in database."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # 2. GROQ prompt
        groq_prompt = f"""
You are simulating feature analysis for the Google Play Store app with ID "{app_id}".

Generate a believable JSON response that includes:

1. totalFeatures: Total number of unique app features.
2. trendingFeatures: Top 5 features with name, usage count, and recent growth percent.
3. featureRequests: Top 3 requested features with id, name, a user-style review, and number of votes.
4. featureTrends: Month-by-month usage trends (past 6 months) for at least 3 features.
5. bugReports: Number of crashes and bugs reported each month over the last 6 months.

Respond ONLY with a valid JSON object using this structure — no explanation or comments:

{{
  "totalFeatures": 3421,
  "trendingFeatures": [
    {{ "name": "Dark Mode", "count": 1243, "change": 12.5 }},
    {{ "name": "Offline Support", "count": 892, "change": 8.2 }},
    {{ "name": "Export Data", "count": 756, "change": 5.7 }},
    {{ "name": "Custom Themes", "count": 432, "change": 4.3 }},
    {{ "name": "Multi-language", "count": 398, "change": 3.8 }}
  ],
  "featureRequests": [
    {{
      "id": "f1",
      "name": "Dark Mode",
      "review": "Please add dark mode to reduce eye strain at night",
      "votes": 1243
    }},
    {{
      "id": "f2",
      "name": "Offline Support",
      "review": "The app should work without internet connection",
      "votes": 892
    }},
    {{
      "id": "f3",
      "name": "Export Data",
      "review": "I need to export my data to CSV for analysis",
      "votes": 756
    }}
  ],
  "featureTrends": [
    {{ "month": "Jan", "Dark Mode": 200, "Offline Support": 150, "Export Data": 120 }},
    {{ "month": "Feb", "Dark Mode": 300, "Offline Support": 180, "Export Data": 140 }},
    {{ "month": "Mar", "Dark Mode": 450, "Offline Support": 220, "Export Data": 180 }},
    {{ "month": "Apr", "Dark Mode": 600, "Offline Support": 300, "Export Data": 220 }},
    {{ "month": "May", "Dark Mode": 800, "Offline Support": 400, "Export Data": 280 }},
    {{ "month": "Jun", "Dark Mode": 1000, "Offline Support": 500, "Export Data": 350 }}
  ],
  "bugReports": [
    {{ "month": "Jan", "crashes": 45, "bugs": 32 }},
    {{ "month": "Feb", "crashes": 38, "bugs": 28 }},
    {{ "month": "Mar", "crashes": 52, "bugs": 41 }},
    {{ "month": "Apr", "crashes": 29, "bugs": 23 }},
    {{ "month": "May", "crashes": 35, "bugs": 30 }},
    {{ "month": "Jun", "crashes": 42, "bugs": 35 }}
  ]
}}
        """

        headers = {
            "Authorization": f"Bearer {self.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        groq_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates realistic feature analytics for app reviews.",
                },
                {"role": "user", "content": groq_prompt},
            ],
        }

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=groq_data,
            )
            if response.status_code == 200:
                json_text = response.json()["choices"][0]["message"]["content"]
                parsed_data = json.loads(json_text)
                return Response({"data": parsed_data}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "GROQ API error", "details": response.text},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        except Exception as e:
            return Response(
                {"error": "Request failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def debug_userapp_fields():
    """Debug function to check UserApp model fields"""
    try:
        UserAppModel = apps.get_model(
            "accounts", "UserApp"
        )  # Adjust app name if needed
        field_names = [field.name for field in UserAppModel._meta.fields]
        print(f"UserApp model fields: {field_names}")
        return field_names
    except Exception as e:
        print(f"Error getting UserApp fields: {str(e)}")
        return []


# Environment validation function (call this in your Django startup)
def validate_environment():
    """Validate that required environment variables are set"""
    warnings = []

    # Check for API keys
    if not getattr(settings, "GOOGLE_PLAY_API_KEY", None) and not getattr(
        settings, "RAPID_API_KEY", None
    ):
        warnings.append("No Google Play or RapidAPI key configured - using mock data")

    if not getattr(settings, "STRIPE_SECRET_KEY", None):
        warnings.append("Stripe secret key not configured - payments will be simulated")

    # Check for placeholder values
    stripe_key = getattr(settings, "STRIPE_SECRET_KEY", "")
    if stripe_key and "your-stripe-secret-key" in stripe_key:
        warnings.append("Stripe key is using placeholder value")

    for warning in warnings:
        logger.warning(f"⚠ Environment: {warning}")

    return warnings