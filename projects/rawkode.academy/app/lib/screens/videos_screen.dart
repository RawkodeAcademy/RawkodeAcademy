import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rawkode_academy/services/video_service.dart';
import 'package:rawkode_academy/widgets/video_card.dart';
import 'package:rawkode_academy/widgets/filter_chips.dart';

class VideosScreen extends StatefulWidget {
  const VideosScreen({super.key});

  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VideoService>().loadVideos();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Videos'),
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: FilterChips(
              selectedFilter: _selectedFilter,
              onFilterChanged: (filter) {
                setState(() {
                  _selectedFilter = filter;
                });
              },
            ),
          ),
          Expanded(
            child: Consumer<VideoService>(
              builder: (context, videoService, child) {
                if (videoService.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (videoService.videos.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.video_library_outlined,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No videos found',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Check back later for new content',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                      ],
                    ),
                  );
                }

                final filteredVideos = _selectedFilter == 'all'
                    ? videoService.videos
                    : videoService.videos
                        .where((video) => video.category == _selectedFilter)
                        .toList();

                return RefreshIndicator(
                  onRefresh: () => videoService.loadVideos(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredVideos.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: VideoCard(video: filteredVideos[index]),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}