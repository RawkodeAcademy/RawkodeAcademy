import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:rawkode_academy/models/video.dart';
import 'package:rawkode_academy/services/graphql_client.dart';
import 'package:rawkode_academy/graphql/queries.dart';

class VideoService extends ChangeNotifier {
  List<Video> _videos = [];
  bool _isLoading = false;
  String? _error;

  List<Video> get videos => _videos;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadVideos({int limit = 20, int offset = 0}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final QueryOptions options = QueryOptions(
        document: gql(getLatestVideosQuery),
        variables: {
          'limit': limit,
          'offset': offset,
        },
      );

      final QueryResult result = await GraphQLClientService.client.query(options);

      if (result.hasException) {
        print('GraphQL Exception: ${result.exception}');
        throw result.exception!;
      }

      print('GraphQL Response: ${result.data}');
      final List<dynamic> videoData = result.data?['getLatestVideos'] ?? [];
      print('Video count: ${videoData.length}');
      _videos = videoData
          .map((video) => Video.fromJson(video as Map<String, dynamic>))
          .toList();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<Video>> searchVideosAsync(String query) async {
    if (query.isEmpty) return [];

    try {
      final QueryOptions options = QueryOptions(
        document: gql(searchVideosQuery),
        variables: {
          'term': query,
          'limit': 20,
        },
      );

      final QueryResult result = await GraphQLClientService.client.query(options);

      if (result.hasException) {
        throw result.exception!;
      }

      final List<dynamic> videoData = result.data?['simpleSearch'] ?? [];
      return videoData
          .map((video) => Video.fromJson(video as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) {
        print('Search error: $e');
      }
      return [];
    }
  }

  List<Video> searchVideos(String query) {
    if (query.isEmpty) return [];
    
    final lowerQuery = query.toLowerCase();
    return _videos.where((video) {
      return video.title.toLowerCase().contains(lowerQuery) ||
          video.description.toLowerCase().contains(lowerQuery) ||
          video.instructor.toLowerCase().contains(lowerQuery) ||
          video.technologies.any((tech) => tech.name.toLowerCase().contains(lowerQuery));
    }).toList();
  }

  List<Video> getVideosByCategory(String category) {
    return _videos.where((video) => video.category == category).toList();
  }

  List<Video> getFeaturedVideos() {
    // Return videos with most likes
    final sorted = List<Video>.from(_videos)
      ..sort((a, b) => b.likes.compareTo(a.likes));
    return sorted.take(5).toList();
  }

  List<Video> getRecentVideos() {
    final sorted = List<Video>.from(_videos)
      ..sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
    return sorted.take(10).toList();
  }

  Future<void> loadRandomVideos({int limit = 5}) async {
    try {
      final QueryOptions options = QueryOptions(
        document: gql(getRandomVideosQuery),
        variables: {
          'limit': limit,
        },
      );

      final QueryResult result = await GraphQLClientService.client.query(options);

      if (result.hasException) {
        throw result.exception!;
      }

      final List<dynamic> videoData = result.data?['getRandomVideos'] ?? [];
      final randomVideos = videoData
          .map((video) => Video.fromJson(video as Map<String, dynamic>))
          .toList();
      
      // Add random videos to the list if not already present
      for (final video in randomVideos) {
        if (!_videos.any((v) => v.id == video.id)) {
          _videos.add(video);
        }
      }
      
      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        print('Load random videos error: $e');
      }
    }
  }
}