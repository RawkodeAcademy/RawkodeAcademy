import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

class GraphQLService {
  static GraphQLService? _instance;
  late final GraphQLClient _client;

  // GraphQL endpoint
  static const String _endpoint = 'https://api.rawkode.academy/graphql';

  // Singleton pattern
  static Future<GraphQLService> getInstance() async {
    if (_instance == null) {
      _instance = GraphQLService._();
      await _instance!._init();
    }
    return _instance!;
  }

  GraphQLService._();

  Future<void> _init() async {
    // Initialize Hive for caching
    final appDocDir = await getApplicationDocumentsDirectory();
    await Hive.initFlutter('${appDocDir.path}/hive');

    // Create an HTTP link
    final HttpLink httpLink = HttpLink(_endpoint);

    // Create a cache object
    final store = await HiveStore.open(boxName: 'graphql');
    final cache = GraphQLCache(store: store);

    // Create the client
    _client = GraphQLClient(
      link: httpLink,
      cache: cache,
      defaultPolicies: DefaultPolicies(
        query: Policies(
          fetch: FetchPolicy.cacheAndNetwork,
          error: ErrorPolicy.none,
          cacheReread: CacheRereadPolicy.mergeOptimistic,
        ),
      ),
    );
  }

  GraphQLClient get client => _client;

  // Helper method to execute queries
  Future<QueryResult> query(String queryString, {Map<String, dynamic>? variables}) async {
    print('GraphQL Query: $queryString');
    print('GraphQL Variables: $variables');

    final options = QueryOptions(
      document: gql(queryString),
      variables: variables ?? {},
      fetchPolicy: FetchPolicy.cacheAndNetwork,
    );

    final result = await _client.query(options);

    if (result.hasException) {
      print('GraphQL Error: ${result.exception.toString()}');
    } else {
      print('GraphQL Result: ${result.data}');
    }

    return result;
  }

  // Helper method to execute mutations
  Future<QueryResult> mutate(String mutationString, {Map<String, dynamic>? variables}) async {
    final options = MutationOptions(
      document: gql(mutationString),
      variables: variables ?? {},
    );

    return await _client.mutate(options);
  }
}
