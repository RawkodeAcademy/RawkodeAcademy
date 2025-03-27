import 'package:equatable/equatable.dart';
import 'package:rawkode_academy/models/video.dart';

enum VideoStatus { initial, loading, success, failure }

class VideoState extends Equatable {
  final VideoStatus status;
  final List<Video> videos;
  final String? errorMessage;
  final bool isRefreshing;

  const VideoState({
    this.status = VideoStatus.initial,
    this.videos = const [],
    this.errorMessage,
    this.isRefreshing = false,
  });

  VideoState copyWith({
    VideoStatus? status,
    List<Video>? videos,
    String? errorMessage,
    bool? isRefreshing,
  }) {
    return VideoState(
      status: status ?? this.status,
      videos: videos ?? this.videos,
      errorMessage: errorMessage ?? this.errorMessage,
      isRefreshing: isRefreshing ?? this.isRefreshing,
    );
  }

  @override
  List<Object?> get props => [status, videos, errorMessage, isRefreshing];
}
