from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Enhanced User Serializer with comprehensive validation and security features
    """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            message="This email is already registered."
        ), 
                    django_validate_email  # Adds built-in email format validation

        ],
        help_text="A valid email address for your account"
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
        min_length=8,
        help_text="Password must be at least 8 characters and contain a mix of letters, numbers, and symbols"
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Enter the same password as above for verification"
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {
                'validators': [
                    UniqueValidator(
                        queryset=User.objects.all(),
                        message="This username is already taken."
                    )
                ],
                'help_text': "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
            }
        }

    def validate_username(self, value):
        """
        Custom username validation to prevent reserved names
        """
        reserved_names = ['admin', 'root', 'superuser']
        if value.lower() in reserved_names:
            raise serializers.ValidationError("This username is not allowed.")
        return value

    def validate_email(self, value):
        """
        Additional email validation
        """
        if 'example.com' in value:
            raise serializers.ValidationError("Please use a real email provider.")
        return value.lower()  # Normalize email to lowercase
    def validate_password(self, value):
        """
        Additional password complexity checks
        """
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least 1 number.")
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least 1 letter.")
        return value
    def validate(self, data):
        """
        Comprehensive validation for the entire payload
        """
        # Password match validation
        if data['password'] != data['password2']:
            raise serializers.ValidationError(
                {"password2": "Passwords must match exactly."}
            )

        # Additional password complexity check
        weak_passwords = ['password', '12345678', f"{data['username']}123"]
        if data['password'].lower() in weak_passwords:
            raise serializers.ValidationError(
                {"password": "This password is too common."}
            )

        return data

    def create(self, validated_data):
        """
        Secure user creation with additional safeguards
        """
        try:
            # Remove password2 before user creation
            validated_data.pop('password2')
            
            # Create user with additional fields if they exist
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                is_active=True  # Set to False if using email verification
            )
            
            # You could add additional setup here (send welcome email, etc.)
            
            return user
        except IntegrityError as e:
            raise serializers.ValidationError(
                {"non_field_errors": ["User creation failed. Please try again."]}
            ) 
        except DjangoValidationError as e:
            # Convert Django validation errors to DRF format
            raise serializers.ValidationError(e.message_dict)
        except Exception as e:
            # Catch any other exceptions
            raise serializers.ValidationError(
                {"non_field_errors": ["An error occurred during user creation."]}
            )

    def to_representation(self, instance):
        """
        Control the output representation of the user data
        """
        representation = super().to_representation(instance)
        # Remove sensitive fields from response
        representation.pop('password', None)
        representation.pop('password2', None)
        return representation