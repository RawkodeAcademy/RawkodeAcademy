import 'package:equatable/equatable.dart';

class Chapter extends Equatable {
  final String title;
  final int startTime;

  const Chapter({
    required this.title,
    required this.startTime,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      title: json['title'] as String,
      startTime: json['startTime'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'startTime': startTime,
      };

  @override
  List<Object?> get props => [title, startTime];
}

class Person extends Equatable {
  final String? id;
  final String? forename;
  final String? surname;
  final String? biography;
  final List<Link>? links;

  const Person({
    this.id,
    this.forename,
    this.surname,
    this.biography,
    this.links,
  });

  factory Person.fromJson(Map<String, dynamic> json) {
    return Person(
      id: json['id'] as String?,
      forename: json['forename'] as String?,
      surname: json['surname'] as String?,
      biography: json['biography'] as String?,
      links: json['links'] != null
          ? (json['links'] as List<dynamic>)
              .map((e) => Link.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'forename': forename,
        'surname': surname,
        'biography': biography,
        'links': links?.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [id, forename, surname, biography, links];
}

class Link extends Equatable {
  final String name;
  final String url;

  const Link({
    required this.name,
    required this.url,
  });

  factory Link.fromJson(Map<String, dynamic> json) {
    return Link(
      name: json['name'] as String,
      url: json['url'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'url': url,
      };

  @override
  List<Object?> get props => [name, url];
}

class CastingCredit extends Equatable {
  final Person? person;

  const CastingCredit({
    this.person,
  });

  factory CastingCredit.fromJson(Map<String, dynamic> json) {
    return CastingCredit(
      person: json['person'] != null
          ? Person.fromJson(json['person'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'person': person?.toJson(),
      };

  @override
  List<Object?> get props => [person];
}

class Episode extends Equatable {
  final String? id;
  final String? code;
  final Show? show;
  final Video? video;

  const Episode({
    this.id,
    this.code,
    this.show,
    this.video,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      id: json['id'] as String?,
      code: json['code'] as String?,
      show: json['show'] != null
          ? Show.fromJson(json['show'] as Map<String, dynamic>)
          : null,
      video: json['video'] != null
          ? Video.fromJson(json['video'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'code': code,
        'show': show?.toJson(),
        'video': video?.toJson(),
      };

  @override
  List<Object?> get props => [id, code, show, video];
}

class Show extends Equatable {
  final String? id;
  final String? name;
  final List<Person>? hosts;
  final List<Episode>? episodes;

  const Show({
    this.id,
    this.name,
    this.hosts,
    this.episodes,
  });

  factory Show.fromJson(Map<String, dynamic> json) {
    return Show(
      id: json['id'] as String?,
      name: json['name'] as String?,
      hosts: json['hosts'] != null
          ? (json['hosts'] as List<dynamic>)
              .map((e) => Person.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      episodes: json['episodes'] != null
          ? (json['episodes'] as List<dynamic>)
              .map((e) => Episode.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'hosts': hosts?.map((e) => e.toJson()).toList(),
        'episodes': episodes?.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [id, name, hosts, episodes];
}

class Video extends Equatable {
  final String? id;
  final String? title;
  final String? thumbnailUrl;
  final String? description;
  final String? subtitle;
  final String? slug;
  final String? streamUrl;
  final int? duration;
  final int? likes;
  final String? publishedAt;
  final List<Chapter>? chapters;
  final Episode? episode;
  final List<CastingCredit>? credits;

  const Video({
    this.id,
    this.title,
    this.thumbnailUrl,
    this.description,
    this.subtitle,
    this.slug,
    this.streamUrl,
    this.duration,
    this.likes,
    this.publishedAt,
    this.chapters,
    this.episode,
    this.credits,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['id'] as String?,
      title: json['title'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      description: json['description'] as String?,
      subtitle: json['subtitle'] as String?,
      slug: json['slug'] as String?,
      streamUrl: json['streamUrl'] as String?,
      duration: json['duration'] as int?,
      likes: json['likes'] as int?,
      publishedAt: json['publishedAt'] as String?,
      chapters: json['chapters'] != null
          ? (json['chapters'] as List<dynamic>)
              .map((e) => Chapter.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      episode: json['episode'] != null
          ? Episode.fromJson(json['episode'] as Map<String, dynamic>)
          : null,
      credits: json['credits'] != null
          ? (json['credits'] as List<dynamic>)
              .map((e) => CastingCredit.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'thumbnailUrl': thumbnailUrl,
        'description': description,
        'subtitle': subtitle,
        'slug': slug,
        'streamUrl': streamUrl,
        'duration': duration,
        'likes': likes,
        'publishedAt': publishedAt,
        'chapters': chapters?.map((e) => e.toJson()).toList(),
        'episode': episode?.toJson(),
        'credits': credits?.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [
        id,
        title,
        thumbnailUrl,
        description,
        subtitle,
        slug,
        streamUrl,
        duration,
        likes,
        publishedAt,
        chapters,
        episode,
        credits,
      ];
}
