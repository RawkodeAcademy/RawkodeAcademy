import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:rawkode_academy/services/video_service.dart';
import 'package:rawkode_academy/widgets/video_card.dart';

class RecentVideosList extends StatelessWidget {
  const RecentVideosList({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoService>(
      builder: (context, videoService, child) {
        final recentVideos = videoService.getRecentVideos();

        if (videoService.isLoading) {
          return const SliverToBoxAdapter(
            child: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (recentVideos.isEmpty) {
          return SliverToBoxAdapter(
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.video_library_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No recent videos',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                ],
              ),
            ),
          );
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: VideoCard(video: recentVideos[index]),
              );
            },
            childCount: recentVideos.length,
          ),
        );
      },
    );
  }
}