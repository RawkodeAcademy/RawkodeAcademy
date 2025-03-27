import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:rawkode_academy/models/video.dart';
import 'package:rawkode_academy/services/graphql_service.dart';

class VideoRepository {
  static const String _videoCacheKey = 'videos_cache';
  static const String _lastFetchTimeKey = 'videos_last_fetch_time';
  static const Duration _cacheExpiration = Duration(hours: 24);

  late final GraphQLService _graphQLService;
  late final Box _cacheBox;

  // GraphQL query for fetching videos
  static const String _getLatestVideosQuery = '''
  query GetLatestVideos(\$limit: Int, \$offset: Int) {
    getLatestVideos(limit: \$limit, offset: \$offset) {
      id
      title
      thumbnailUrl
      description
      subtitle
      slug
      streamUrl
      duration
      likes
      publishedAt
      chapters {
        title
        startTime
      }
      episode {
        id
        code
        show {
          id
          name
        }
      }
    }
  }
  ''';

  // Singleton pattern
  static VideoRepository? _instance;

  static Future<VideoRepository> getInstance() async {
    if (_instance == null) {
      _instance = VideoRepository._();
      await _instance!._init();
    }
    return _instance!;
  }

  VideoRepository._();

  Future<void> _init() async {
    _graphQLService = await GraphQLService.getInstance();

    // Initialize Hive for caching if not already initialized
    if (!Hive.isBoxOpen('video_cache')) {
      await Hive.openBox('video_cache');
    }
    _cacheBox = Hive.box('video_cache');
  }

  // Get videos from cache or network
  Future<List<Video>> getLatestVideos({int limit = 200, int offset = 0, bool forceRefresh = false}) async {
    // Always force refresh to get the latest data
    forceRefresh = true;

    // Check if we should use cache
    if (!forceRefresh && _isCacheValid()) {
      final cachedVideos = _getCachedVideos();
      if (cachedVideos.isNotEmpty) {
        return cachedVideos;
      }
    }

    // Fetch from network
    final result = await _graphQLService.query(
      _getLatestVideosQuery,
      variables: {'limit': limit, 'offset': offset},
    );

    if (result.hasException) {
      debugPrint('GraphQL error: ${result.exception.toString()}');
      // Return cached data if available, even if expired
      final cachedVideos = _getCachedVideos();
      if (cachedVideos.isNotEmpty) {
        return cachedVideos;
      }
      throw Exception('Failed to fetch videos: ${result.exception.toString()}');
    }

    // Parse the result
    final List<dynamic> videosData = result.data?['getLatestVideos'] ?? [];
    final List<Video> videos = videosData
        .map((videoData) => Video.fromJson(videoData as Map<String, dynamic>))
        .toList();

    // Cache the result
    _cacheVideos(videos);

    return videos;
  }

  // Check if cache is still valid
  bool _isCacheValid() {
    final lastFetchTime = _cacheBox.get(_lastFetchTimeKey);
    if (lastFetchTime == null) return false;

    final lastFetch = DateTime.parse(lastFetchTime);
    final now = DateTime.now();
    return now.difference(lastFetch) < _cacheExpiration;
  }

  // Get videos from cache
  List<Video> _getCachedVideos() {
    final cachedData = _cacheBox.get(_videoCacheKey);
    if (cachedData == null) return [];

    try {
      final List<dynamic> videosData = jsonDecode(cachedData);
      return videosData
          .map((videoData) => Video.fromJson(videoData as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Error parsing cached videos: $e');
      return [];
    }
  }

  // Cache videos
  Future<void> _cacheVideos(List<Video> videos) async {
    final videosJson = jsonEncode(videos.map((v) => v.toJson()).toList());
    await _cacheBox.put(_videoCacheKey, videosJson);
    await _cacheBox.put(_lastFetchTimeKey, DateTime.now().toIso8601String());
  }

  // Clear cache
  Future<void> clearCache() async {
    await _cacheBox.delete(_videoCacheKey);
    await _cacheBox.delete(_lastFetchTimeKey);
  }
}
