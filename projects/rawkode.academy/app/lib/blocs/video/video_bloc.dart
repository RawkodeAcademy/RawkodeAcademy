import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rawkode_academy/blocs/video/video_event.dart';
import 'package:rawkode_academy/blocs/video/video_state.dart';
import 'package:rawkode_academy/repositories/video_repository.dart';

class VideoBloc extends Bloc<VideoEvent, VideoState> {
  final VideoRepository _videoRepository;

  VideoBloc({required VideoRepository videoRepository})
      : _videoRepository = videoRepository,
        super(const VideoState()) {
    on<LoadVideos>(_onLoadVideos);
    on<RefreshVideos>(_onRefreshVideos);
    on<ClearVideosCache>(_onClearVideosCache);
  }

  Future<void> _onLoadVideos(
    LoadVideos event,
    Emitter<VideoState> emit,
  ) async {
    try {
      if (state.status == VideoStatus.initial || event.forceRefresh) {
        emit(state.copyWith(status: VideoStatus.loading));
      }

      final videos = await _videoRepository.getLatestVideos(
        forceRefresh: event.forceRefresh,
      );

      emit(state.copyWith(
        status: VideoStatus.success,
        videos: videos,
        errorMessage: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: VideoStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshVideos(
    RefreshVideos event,
    Emitter<VideoState> emit,
  ) async {
    try {
      emit(state.copyWith(isRefreshing: true));

      final videos = await _videoRepository.getLatestVideos(forceRefresh: true);

      emit(state.copyWith(
        status: VideoStatus.success,
        videos: videos,
        errorMessage: null,
        isRefreshing: false,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: VideoStatus.failure,
        errorMessage: e.toString(),
        isRefreshing: false,
      ));
    }
  }

  Future<void> _onClearVideosCache(
    ClearVideosCache event,
    Emitter<VideoState> emit,
  ) async {
    await _videoRepository.clearCache();
    add(const LoadVideos(forceRefresh: true));
  }
}
