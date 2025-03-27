import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:rawkode_academy/repositories/video_repository.dart';
import 'package:rawkode_academy/screens/home_screen.dart';
import 'package:rawkode_academy/screens/login_screen.dart';
import 'package:rawkode_academy/services/web_auth_service.dart';
import 'package:rawkode_academy/utils/constants.dart';

void main(List<String> args) async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive for caching
  final appDocDir = await getApplicationDocumentsDirectory();
  await Hive.initFlutter('${appDocDir.path}/hive');

  // Initialize repositories
  final videoRepository = await VideoRepository.getInstance();

  // Check for URL in command line arguments
  String? initialUrl;
  for (int i = 0; i < args.length - 1; i++) {
    if (args[i] == '--url' && args[i + 1].startsWith('app.rawkode.academy://')) {
      initialUrl = args[i + 1];
      break;
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WebAuthService()),
        Provider<VideoRepository>.value(value: videoRepository),
      ],
      child: RawkodeAcademyApp(initialUrl: initialUrl),
    ),
  );
}

class RawkodeAcademyApp extends StatefulWidget {
  final String? initialUrl;

  const RawkodeAcademyApp({super.key, this.initialUrl});

  @override
  State<RawkodeAcademyApp> createState() => _RawkodeAcademyAppState();
}

class _RawkodeAcademyAppState extends State<RawkodeAcademyApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();

    // Handle initial URL if provided
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleInitialUrl();
    });
  }

  void _handleInitialUrl() {
    if (widget.initialUrl != null) {
      final uri = Uri.parse(widget.initialUrl!);
      if (uri.scheme == 'app.rawkode.academy') {
        if (uri.path == '/callback') {
          // Handle OAuth callback
          final authService = Provider.of<WebAuthService>(context, listen: false);
          authService.handleAuthorizationResponse(uri).then((success) {
            if (success) {
              _navigatorKey.currentState?.pushReplacementNamed('/home');
            }
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _navigatorKey,
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primaryColor,
          primary: AppColors.primaryColor,
          secondary: AppColors.accentColor,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.backgroundColor,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            foregroundColor: Colors.white,
            backgroundColor: AppColors.primaryColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: AppColors.primaryColor,
              width: 2,
            ),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/login': (context) => const LoginScreen(),
      },
      // Handle deep links for OAuth callback
      onGenerateRoute: (settings) {
        // Handle callback URLs
        if (settings.name != null) {
          final uri = Uri.parse(settings.name!);
          if (uri.scheme == 'app.rawkode.academy') {
            if (uri.path == '/callback') {
              // Handle OAuth callback
              final authService = Provider.of<WebAuthService>(context, listen: false);
              authService.handleAuthorizationResponse(uri).then((success) {
                if (success) {
                  Navigator.of(context).pushReplacementNamed('/home');
                }
              });
              return MaterialPageRoute(
                builder: (_) => const Scaffold(
                  body: Center(
                    child: CircularProgressIndicator(),
                  ),
                ),
              );
            }
          }
        }
        return null;
      },
    );
  }
}
