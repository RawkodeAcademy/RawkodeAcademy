import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rawkode_academy/blocs/video/video.dart';
import 'package:rawkode_academy/repositories/video_repository.dart';
import 'package:rawkode_academy/screens/video_player_screen.dart';
import 'package:rawkode_academy/widgets/video_card.dart';

class VideosScreen extends StatelessWidget {
  const VideosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Use the existing VideoBloc from the parent widget if available
    final parentBloc = context.findAncestorWidgetOfExactType<BlocProvider<VideoBloc>>();

    if (parentBloc != null) {
      return const VideosView();
    }

    // Otherwise, create a new VideoBloc
    return BlocProvider(
      create: (context) {
        final videoRepository = context.read<VideoRepository>();
        return VideoBloc(videoRepository: videoRepository)
          ..add(const LoadVideos());
      },
      child: const VideosView(),
    );
  }
}

class VideosView extends StatefulWidget {
  const VideosView({super.key});

  @override
  State<VideosView> createState() => _VideosViewState();
}

class _VideosViewState extends State<VideosView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Videos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            tooltip: 'Clear Cache',
            onPressed: () {
              context.read<VideoBloc>().add(ClearVideosCache());
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              context.read<VideoBloc>().add(RefreshVideos());
            },
          ),
        ],
      ),
      body: BlocBuilder<VideoBloc, VideoState>(
        builder: (context, state) {
          if (state.status == VideoStatus.initial) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == VideoStatus.loading && state.videos.isEmpty) {
            return ListView.builder(
              itemCount: 5,
              itemBuilder: (context, index) => const VideoCardSkeleton(),
            );
          }

          if (state.status == VideoStatus.failure && state.videos.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Failed to load videos'),
                  if (state.errorMessage != null)
                    Text(
                      state.errorMessage!,
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<VideoBloc>().add(const LoadVideos(forceRefresh: true));
                    },
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<VideoBloc>().add(RefreshVideos());
              // Wait for the refresh to complete
              await Future.delayed(const Duration(seconds: 1));
            },
            child: ListView.builder(
              controller: _scrollController,
              itemCount: state.videos.length,
              itemBuilder: (context, index) {
                final video = state.videos[index];
                return VideoCard(
                  video: video,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => VideoPlayerScreen(video: video),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
