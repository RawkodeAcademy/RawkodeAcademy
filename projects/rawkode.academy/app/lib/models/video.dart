import 'package:rawkode_academy/models/episode.dart';
import 'package:rawkode_academy/models/person.dart';
import 'package:rawkode_academy/models/technology.dart';

class Video {
  final String id;
  final String title;
  final String? subtitle;
  final String description;
  final String slug;
  final String thumbnailUrl;
  final String streamUrl;
  final int duration; // in seconds
  final DateTime publishedAt;
  final int likes;
  final Episode? episode;
  final List<Person> guests;
  final List<Technology> technologies;

  const Video({
    required this.id,
    required this.title,
    this.subtitle,
    required this.description,
    required this.slug,
    required this.thumbnailUrl,
    required this.streamUrl,
    required this.duration,
    required this.publishedAt,
    required this.likes,
    this.episode,
    required this.guests,
    required this.technologies,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      description: json['description'] as String? ?? '',
      slug: json['slug'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String,
      streamUrl: json['streamUrl'] as String,
      duration: json['duration'] as int,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      likes: json['likes'] as int? ?? 0,
      episode: json['episode'] != null
          ? Episode.fromJson(json['episode'] as Map<String, dynamic>)
          : null,
      guests: (json['guests'] as List<dynamic>?)
          ?.map((guest) => Person.fromJson(guest as Map<String, dynamic>))
          .toList() ?? [],
      technologies: (json['technologies'] as List<dynamic>?)
          ?.map((tech) => Technology.fromJson(tech as Map<String, dynamic>))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      if (subtitle != null) 'subtitle': subtitle,
      'description': description,
      'slug': slug,
      'thumbnailUrl': thumbnailUrl,
      'streamUrl': streamUrl,
      'duration': duration,
      'publishedAt': publishedAt.toIso8601String(),
      'likes': likes,
      if (episode != null) 'episode': episode!.toJson(),
      'guests': guests.map((guest) => guest.toJson()).toList(),
      'technologies': technologies.map((tech) => tech.toJson()).toList(),
    };
  }

  Duration get durationAsObject => Duration(seconds: duration);

  String get formattedDuration {
    final totalMinutes = duration ~/ 60;
    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;
    final seconds = duration % 60;
    
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }

  String get formattedLikes {
    if (likes >= 1000000) {
      return '${(likes / 1000000).toStringAsFixed(1)}M likes';
    } else if (likes >= 1000) {
      return '${(likes / 1000).toStringAsFixed(1)}K likes';
    } else {
      return '$likes likes';
    }
  }

  String get category {
    // Derive category from show name or technologies
    if (episode?.show?.name != null) {
      return episode!.show!.name;
    } else if (technologies.isNotEmpty) {
      return technologies.first.name;
    }
    return 'General';
  }

  String get instructor {
    // Use the first guest name if available, otherwise use show hosts
    if (guests.isNotEmpty) {
      return guests.first.fullName;
    } else if (episode?.show?.hosts.isNotEmpty ?? false) {
      return episode!.show!.hosts.first.fullName;
    }
    return 'Rawkode Academy';
  }
}