import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:rawkode_academy/models/show.dart';
import 'package:rawkode_academy/services/graphql_client.dart';
import 'package:rawkode_academy/graphql/queries.dart';

class ShowService extends ChangeNotifier {
  List<Show> _shows = [];
  bool _isLoading = false;
  String? _error;

  List<Show> get shows => _shows;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadShows() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final QueryOptions options = QueryOptions(
        document: gql(getAllShowsQuery),
      );

      final QueryResult result = await GraphQLClientService.client.query(options);

      if (result.hasException) {
        throw result.exception!;
      }

      final List<dynamic> showData = result.data?['allShows'] ?? [];
      _shows = showData
          .map((show) => Show.fromJson(show as Map<String, dynamic>))
          .toList();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }
}