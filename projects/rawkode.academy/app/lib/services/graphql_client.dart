import 'package:graphql_flutter/graphql_flutter.dart';

class GraphQLClientService {
  static const String _apiUrl = 'https://api.rawkode.academy/graphql';
  
  static GraphQLClient? _client;

  static GraphQLClient get client {
    _client ??= GraphQLClient(
      link: HttpLink(_apiUrl),
      cache: GraphQLCache(store: InMemoryStore()),
    );
    return _client!;
  }

  static Future<void> initialize() async {
    await initHiveForFlutter();
  }
}