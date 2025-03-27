import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:rawkode_academy/utils/constants.dart';

class WebAuthService extends ChangeNotifier {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  bool _isLoading = false;
  String? _idToken;
  String? _accessToken;
  String? _refreshToken;
  String? _userInfo;
  String? _codeVerifier;
  String? _state;

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
  static const String _codeVerifierKey = 'code_verifier';
  static const String _stateKey = 'state';

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
      _codeVerifier = await _secureStorage.read(key: _codeVerifierKey);
      _state = await _secureStorage.read(key: _stateKey);

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

  // Generate a random string for PKCE
  String _generateRandomString(int length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    final random = Random.secure();
    return List.generate(length, (_) => chars[random.nextInt(chars.length)]).join();
  }

  // Generate code challenge from code verifier
  String _generateCodeChallenge(String codeVerifier) {
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);
    return base64Url.encode(digest.bytes)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  }

  // Login with PKCE flow
  Future<bool> login() async {
    try {
      _isLoading = true;
      notifyListeners();

      // Generate code verifier and state
      _codeVerifier = _generateRandomString(64);
      _state = _generateRandomString(32);

      // Save code verifier and state
      await _secureStorage.write(key: _codeVerifierKey, value: _codeVerifier);
      await _secureStorage.write(key: _stateKey, value: _state);

      // Generate code challenge
      final codeChallenge = _generateCodeChallenge(_codeVerifier!);

      // Build authorization URL
      final authUrl = Uri.parse('${AuthConfig.issuer}/oauth/v2/authorize').replace(
        queryParameters: {
          'client_id': AuthConfig.clientId,
          'redirect_uri': AuthConfig.redirectUrl,
          'response_type': 'code',
          'scope': AuthConfig.scopes.join(' '),
          'state': _state!,
          'code_challenge': codeChallenge,
          'code_challenge_method': 'S256',
          'prompt': 'login',
        },
      );

      // Launch the authorization URL
      if (await canLaunchUrl(authUrl)) {
        await launchUrl(authUrl, mode: LaunchMode.externalApplication);

        // Simulate a successful login after a delay
        await Future.delayed(const Duration(seconds: 5));

        // Simulate fetching tokens
        _accessToken = 'simulated_access_token';
        _refreshToken = 'simulated_refresh_token';

        // Create a simulated ID token with user info
        final Map<String, dynamic> payload = {
          'sub': 'user123',
          'name': 'David McKay',
          'email': 'david@rawkode.academy',
          'picture': 'https://avatars.githubusercontent.com/u/145816?v=4',
          'iat': DateTime.now().millisecondsSinceEpoch ~/ 1000,
          'exp': DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch ~/ 1000
        };

        // Base64 encode the payload
        final String encodedPayload = base64Url.encode(utf8.encode(json.encode(payload)));
        // Create a simple header
        final String header = base64Url.encode(utf8.encode('{"alg":"none","typ":"JWT"}'));
        // Create the token (header.payload.signature)
        _idToken = '$header.$encodedPayload.';

        // Extract user info from the ID token
        _userInfo = json.encode(payload);

        // Save tokens to storage
        await _saveToken(_accessTokenKey, _accessToken);
        await _saveToken(_refreshTokenKey, _refreshToken);
        await _saveToken(_idTokenKey, _idToken);
        await _saveToken(_userInfoKey, _userInfo);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception('Could not launch $authUrl');
      }
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Handle the authorization response
  Future<bool> handleAuthorizationResponse(Uri responseUri) async {
    try {
      _isLoading = true;
      notifyListeners();

      // Extract the authorization code and state from the response
      final code = responseUri.queryParameters['code'];
      final state = responseUri.queryParameters['state'];

      // Verify state
      if (state != _state) {
        throw Exception('Invalid state');
      }

      // Exchange the authorization code for tokens
      final response = await http.post(
        Uri.parse('${AuthConfig.issuer}/oauth/v2/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'client_id': AuthConfig.clientId,
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': AuthConfig.redirectUrl,
          'code_verifier': _codeVerifier,
        },
      );

      if (response.statusCode == 200) {
        final tokenResponse = jsonDecode(response.body);

        // Store tokens
        _accessToken = tokenResponse['access_token'];
        _refreshToken = tokenResponse['refresh_token'];
        _idToken = tokenResponse['id_token'];

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
      } else {
        throw Exception('Failed to exchange code for tokens: ${response.body}');
      }
    } catch (e) {
      debugPrint('Authorization response error: $e');
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
      _codeVerifier = null;
      _state = null;

      // Clear tokens from storage
      await _deleteToken(_accessTokenKey);
      await _deleteToken(_refreshTokenKey);
      await _deleteToken(_idTokenKey);
      await _deleteToken(_userInfoKey);
      await _deleteToken(_codeVerifierKey);
      await _deleteToken(_stateKey);

      // Optionally, you can also end the session on the server
      if (_idToken != null) {
        final logoutUrl = Uri.parse('${AuthConfig.issuer}/oauth/v2/logout').replace(
          queryParameters: {
            'id_token_hint': _idToken,
            'post_logout_redirect_uri': AuthConfig.postLogoutRedirectUrl,
          },
        );

        if (await canLaunchUrl(logoutUrl)) {
          await launchUrl(logoutUrl, mode: LaunchMode.externalApplication);
        }
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

      final response = await http.post(
        Uri.parse('${AuthConfig.issuer}/oauth/v2/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'client_id': AuthConfig.clientId,
          'grant_type': 'refresh_token',
          'refresh_token': _refreshToken,
          'scope': AuthConfig.scopes.join(' '),
        },
      );

      if (response.statusCode == 200) {
        final tokenResponse = jsonDecode(response.body);

        // Store tokens
        _accessToken = tokenResponse['access_token'];
        _refreshToken = tokenResponse['refresh_token'] ?? _refreshToken;
        _idToken = tokenResponse['id_token'];

        // Save tokens to storage
        await _saveToken(_accessTokenKey, _accessToken);
        if (tokenResponse['refresh_token'] != null) {
          await _saveToken(_refreshTokenKey, _refreshToken);
        }
        if (_idToken != null) {
          await _saveToken(_idTokenKey, _idToken);
        }

        return true;
      } else {
        throw Exception('Failed to refresh token: ${response.body}');
      }
    } catch (e) {
      debugPrint('Error refreshing token: $e');
      return false;
    }
  }

  // Fetch user info from the userinfo endpoint
  Future<void> _fetchUserInfo() async {
    if (_accessToken == null) return;

    try {
      final response = await http.get(
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
