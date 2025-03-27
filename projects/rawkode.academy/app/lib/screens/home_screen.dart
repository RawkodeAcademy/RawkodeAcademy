import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rawkode_academy/blocs/video/video.dart';
import 'package:rawkode_academy/repositories/video_repository.dart';
import 'package:rawkode_academy/screens/video_player_screen.dart';
import 'package:rawkode_academy/screens/videos_screen.dart';
import 'package:rawkode_academy/services/web_auth_service.dart';
import 'package:rawkode_academy/utils/constants.dart';
import 'package:rawkode_academy/widgets/video_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Get the VideoRepository from the parent widget
    final videoRepository = Provider.of<VideoRepository>(context);

    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<VideoRepository>.value(value: videoRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) {
              final videoRepository = context.read<VideoRepository>();
              return VideoBloc(
                videoRepository: videoRepository,
              )..add(const LoadVideos());
            },
          ),
        ],
        child: const HomeView(),
      ),
    );
  }
}

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<WebAuthService>(context);
    final userInfo = authService.getUserInfoMap();

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHomeTab(userInfo),
          const VideosScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.video_library),
            label: 'Videos',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab(Map<String, dynamic>? userInfo) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome to Rawkode Academy',
              style: AppTextStyles.heading,
            ),
            const SizedBox(height: 24),

            if (userInfo != null) ...[
              _buildUserInfoCard(userInfo),
              const SizedBox(height: 24),
            ],

            const Text(
              'Latest Videos',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Latest videos section
            Expanded(
              child: BlocBuilder<VideoBloc, VideoState>(
                builder: (context, state) {
                  if (state.status == VideoStatus.initial ||
                      (state.status == VideoStatus.loading && state.videos.isEmpty)) {
                    return ListView.builder(
                      itemCount: 3,
                      itemBuilder: (context, index) => const VideoCardSkeleton(),
                    );
                  }

                  if (state.status == VideoStatus.failure && state.videos.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Failed to load videos'),
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

                  // Show first 3 videos
                  final videos = state.videos.take(3).toList();

                  return Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          itemCount: videos.length,
                          itemBuilder: (context, index) {
                            final video = videos[index];
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
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16.0),
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _currentIndex = 1; // Switch to Videos tab
                            });
                          },
                          child: const Text('View All Videos'),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserInfoCard(Map<String, dynamic> userInfo) {
    final name = userInfo['name'] ?? 'User';
    final email = userInfo['email'] ?? '';
    final picture = userInfo['picture'] as String?;

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            if (picture != null)
              CircleAvatar(
                radius: 30,
                backgroundImage: NetworkImage(picture),
              )
            else
              const CircleAvatar(
                radius: 30,
                backgroundColor: AppColors.primaryColor,
                child: Icon(Icons.person, color: Colors.white, size: 30),
              ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (email.isNotEmpty)
                    Text(
                      email,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
