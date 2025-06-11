import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rawkode_academy/widgets/main_navigation.dart';
import 'package:rawkode_academy/utils/theme.dart';
import 'package:rawkode_academy/services/video_service.dart';
import 'package:rawkode_academy/services/graphql_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GraphQLClientService.initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => VideoService()),
      ],
      child: MaterialApp(
        title: 'Rawkode Academy',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const MainNavigation(),
      ),
    );
  }
}
