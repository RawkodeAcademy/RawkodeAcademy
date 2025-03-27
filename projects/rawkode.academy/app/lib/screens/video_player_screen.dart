import 'package:flutter/material.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';
import 'package:rawkode_academy/models/video.dart';
import 'package:rawkode_academy/utils/constants.dart';

class VideoPlayerScreen extends StatefulWidget {
  final Video video;

  const VideoPlayerScreen({
    super.key,
    required this.video,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    if (widget.video.streamUrl == null || widget.video.streamUrl!.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Video URL is not available';
      });
      return;
    }

    // Debug log
    print('Initializing video player with URL: ${widget.video.streamUrl}');

    try {
      // Initialize video player with the HLS stream URL
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(widget.video.streamUrl!),
      );

      await _videoPlayerController!.initialize();

      // Create Chewie controller
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        autoPlay: true,
        looping: false,
        allowFullScreen: true,
        allowMuting: true,
        showControls: true,
        placeholder: Container(
          color: Colors.black,
          child: const Center(
            child: CircularProgressIndicator(
              color: AppColors.primaryColor,
            ),
          ),
        ),
        errorBuilder: (context, errorMessage) {
          return Center(
            child: Text(
              errorMessage,
              style: const TextStyle(color: Colors.white),
            ),
          );
        },
      );

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error initializing video player with ExoPlayer: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading video: $e';
      });
    }
  }

  @override
  void dispose() {
    _videoPlayerController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.video.title ?? 'Video Player'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Video Player
            AspectRatio(
              aspectRatio: 16 / 9,
              child: _buildVideoPlayer(),
            ),

            // Video Info
            Expanded(
              child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    widget.video.title ?? 'Untitled Video',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subtitle if available
                  if (widget.video.subtitle != null) ...[
                    Text(
                      widget.video.subtitle!,
                      style: const TextStyle(
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Description
                  if (widget.video.description != null) ...[
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.video.description!,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Chapters
                  if (widget.video.chapters != null &&
                      widget.video.chapters!.isNotEmpty) ...[
                    const Text(
                      'Chapters',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: widget.video.chapters!.length,
                      itemBuilder: (context, index) {
                        final chapter = widget.video.chapters![index];
                        return ListTile(
                          title: Text(chapter.title),
                          subtitle: Text(_formatDuration(chapter.startTime)),
                          leading: const Icon(Icons.play_circle_outline),
                          onTap: () {
                            // Seek to chapter start time
                            if (_chewieController != null && _videoPlayerController != null) {
                              _videoPlayerController!.seekTo(
                                Duration(seconds: chapter.startTime),
                              );
                            }
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Show info if available
                  if (widget.video.episode?.show != null) ...[
                    const Text(
                      'Show',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      title: Text(
                        widget.video.episode!.show!.name ?? 'Unknown Show',
                      ),
                      leading: const Icon(Icons.tv),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Credits if available
                  if (widget.video.credits != null &&
                      widget.video.credits!.isNotEmpty) ...[
                    const Text(
                      'Credits',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: widget.video.credits!.length,
                      itemBuilder: (context, index) {
                        final credit = widget.video.credits![index];
                        if (credit.person == null) {
                          return const SizedBox.shrink();
                        }
                        return ListTile(
                          title: Text(
                            '${credit.person!.forename ?? ''} ${credit.person!.surname ?? ''}'.trim(),
                          ),
                          subtitle: credit.person!.biography != null
                              ? Text(
                                  credit.person!.biography!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                )
                              : null,
                          leading: const Icon(Icons.person),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoPlayer() {
    if (_isLoading) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: AppColors.primaryColor,
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Text(
            _errorMessage!,
            style: const TextStyle(color: Colors.white),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    if (_chewieController != null) {
      return Chewie(controller: _chewieController!);
    }

    return Container(
      color: Colors.black,
      child: const Center(
        child: Text(
          'Failed to load video player (ExoPlayer)',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  String _formatDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    final minutes = duration.inMinutes;
    final remainingSeconds = duration.inSeconds % 60;

    if (minutes >= 60) {
      final hours = duration.inHours;
      final remainingMinutes = minutes % 60;
      return '$hours:${remainingMinutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    }

    return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}
