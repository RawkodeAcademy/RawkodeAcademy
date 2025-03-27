import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:rawkode_academy/utils/constants.dart';

class AuthService extends ChangeNotifier {
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  AuthService() {
    // Initialize
  }

  bool _isLoading = false;
  String? _idToken;
  String? _accessToken;
  String? _refreshToken;
  String? _userInfo;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _accessToken != null;
  String? get idToken => _idToken;
  String? get accessToken => _accessToken;
  String? get userInfo => _userInfo;

  // Keys for secure storage
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _idTokenKey = 'id_token';
  static const String _userInfoKey = 'user_info';

  // Initialize the service by checking for existing tokens
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Check if we have stored tokens
      _accessToken = await _secureStorage.read(key: _accessTokenKey);
      _refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      _idToken = await _secureStorage.read(key: _idTokenKey);
      _userInfo = await _secureStorage.read(key: _userInfoKey);

      // If we have a refresh token, try to refresh the access token
      if (_refreshToken != null) {
        await _refreshAccessToken();
      }
    } catch (e) {
      debugPrint('Error initializing auth service: $e');
      await logout(); // Clear any potentially invalid tokens
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login with PKCE flow
  Future<bool> login() async {
    try {
      _isLoading = true;
      notifyListeners();

      // Configure the authorization request
      final AuthorizationTokenRequest authRequest = AuthorizationTokenRequest(
        AuthConfig.clientId,
        AuthConfig.redirectUrl,
        serviceConfiguration: AuthorizationServiceConfiguration(
          authorizationEndpoint: '${AuthConfig.issuer}/oauth/v2/authorize',
          tokenEndpoint: '${AuthConfig.issuer}/oauth/v2/token',
          endSessionEndpoint: '${AuthConfig.issuer}/oauth/v2/logout',
        ),
        scopes: AuthConfig.scopes,
        promptValues: ['login'],
      );

      // Make the authorization request
      final AuthorizationTokenResponse? result =
          await _appAuth.authorizeAndExchangeCode(authRequest);

      if (result != null) {
        // Store tokens
        _accessToken = result.accessToken;
        _refreshToken = result.refreshToken;
        _idToken = result.idToken;

        // Save tokens to storage
        await _saveToken(_accessTokenKey, _accessToken);
        if (_refreshToken != null) {
          await _saveToken(_refreshTokenKey, _refreshToken);
        }
        if (_idToken != null) {
          await _saveToken(_idTokenKey, _idToken);
        }

        // Fetch user info
        await _fetchUserInfo();

        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout and clear tokens
  Future<void> logout() async {
    try {
      _isLoading = true;
      notifyListeners();

      // Clear tokens from memory
      _accessToken = null;
      _refreshToken = null;
      _idToken = null;
      _userInfo = null;

      // Clear tokens from storage
      await _deleteToken(_accessTokenKey);
      await _deleteToken(_refreshTokenKey);
      await _deleteToken(_idTokenKey);
      await _deleteToken(_userInfoKey);

      // Optionally, you can also end the session on the server
      // This depends on the OIDC provider's support for end_session_endpoint
      if (_idToken != null) {
        await _appAuth.endSession(EndSessionRequest(
          idTokenHint: _idToken,
          postLogoutRedirectUrl: AuthConfig.postLogoutRedirectUrl,
          serviceConfiguration: AuthorizationServiceConfiguration(
            authorizationEndpoint: '${AuthConfig.issuer}/oauth/v2/authorize',
            tokenEndpoint: '${AuthConfig.issuer}/oauth/v2/token',
            endSessionEndpoint: '${AuthConfig.issuer}/oauth/v2/logout',
          ),
        ));
      }
    } catch (e) {
      debugPrint('Logout error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Refresh the access token using the refresh token
  Future<bool> _refreshAccessToken() async {
    try {
      if (_refreshToken == null) return false;

      final TokenRequest tokenRequest = TokenRequest(
        AuthConfig.clientId,
        AuthConfig.redirectUrl,
        serviceConfiguration: AuthorizationServiceConfiguration(
          authorizationEndpoint: '${AuthConfig.issuer}/oauth/v2/authorize',
          tokenEndpoint: '${AuthConfig.issuer}/oauth/v2/token',
          endSessionEndpoint: '${AuthConfig.issuer}/oauth/v2/logout',
        ),
        refreshToken: _refreshToken,
        scopes: AuthConfig.scopes,
        grantType: 'refresh_token',
      );

      final TokenResponse? response = await _appAuth.token(tokenRequest);

      if (response != null) {
        _accessToken = response.accessToken;
        _refreshToken = response.refreshToken ?? _refreshToken;
        _idToken = response.idToken;

        // Update stored tokens
        await _saveToken(_accessTokenKey, _accessToken);
        if (response.refreshToken != null) {
          await _saveToken(_refreshTokenKey, _refreshToken);
        }
        if (response.idToken != null) {
          await _saveToken(_idTokenKey, _idToken);
        }

        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error refreshing token: $e');
      return false;
    }
  }

  // Fetch user info from the userinfo endpoint
  Future<void> _fetchUserInfo() async {
    if (_accessToken == null) return;

    try {
      final http.Response response = await http.get(
        Uri.parse('${AuthConfig.issuer}/oidc/v1/userinfo'),
        headers: {'Authorization': 'Bearer $_accessToken'},
      );

      if (response.statusCode == 200) {
        _userInfo = response.body;
        await _saveToken(_userInfoKey, _userInfo);
      } else {
        debugPrint('Failed to get user info: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching user info: $e');
    }
  }

  // Helper methods for token storage
  Future<void> _saveToken(String key, String? value) async {
    if (value == null) return;
    await _secureStorage.write(key: key, value: value);
  }

  Future<String?> _readToken(String key) async {
    return await _secureStorage.read(key: key);
  }

  Future<void> _deleteToken(String key) async {
    await _secureStorage.delete(key: key);
  }

  // Get user info as a Map
  Map<String, dynamic>? getUserInfoMap() {
    if (_userInfo == null) return null;
    try {
      return json.decode(_userInfo!) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error parsing user info: $e');
      return null;
    }
  }

  // Check if the token is expired and refresh if needed
  Future<bool> checkAndRefreshToken() async {
    if (_accessToken == null) return false;

    // A more sophisticated implementation would check the token expiry
    // For now, we'll just try to refresh if we have a refresh token
    if (_refreshToken != null) {
      return await _refreshAccessToken();
    }

    return _accessToken != null;
  }
}
