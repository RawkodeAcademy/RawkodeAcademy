import 'package:equatable/equatable.dart';

abstract class VideoEvent extends Equatable {
  const VideoEvent();

  @override
  List<Object> get props => [];
}

class LoadVideos extends VideoEvent {
  final bool forceRefresh;

  const LoadVideos({this.forceRefresh = false});

  @override
  List<Object> get props => [forceRefresh];
}

class RefreshVideos extends VideoEvent {}

class ClearVideosCache extends VideoEvent {}
