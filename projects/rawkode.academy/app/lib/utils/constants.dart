import 'package:flutter/material.dart';

// Auth Configuration
class AuthConfig {
  static const String clientId = '313033346148008069';
  static const String issuer = 'https://zitadel.rawkode.academy';
  static const String redirectUrl = 'app.rawkode.academy://callback';
  static const String postLogoutRedirectUrl = 'app.rawkode.academy://logout-callback';
  static const List<String> scopes = ['openid', 'profile', 'email', 'offline_access'];
}

// App Colors
class AppColors {
  static const Color primaryColor = Color(0xFF3A86FF);
  static const Color accentColor = Color(0xFFFF006E);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color textColor = Color(0xFF333333);
  static const Color errorColor = Color(0xFFFF4444);
}

// App Text Styles
class AppTextStyles {
  static const TextStyle heading = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.textColor,
  );

  static const TextStyle body = TextStyle(
    fontSize: 16,
    color: AppColors.textColor,
  );

  static const TextStyle buttonText = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );
}

// String Constants
class AppStrings {
  static const String appName = 'Rawkode Academy';
  static const String loginTitle = 'Welcome to Rawkode Academy';
  static const String loginSubtitle = 'Sign in to start your learning journey';
  static const String loginButton = 'Sign in with ZITADEL';
  static const String logoutButton = 'Sign Out';
}
