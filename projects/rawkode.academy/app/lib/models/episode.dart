import 'package:rawkode_academy/models/show.dart';

class Episode {
  final String id;
  final String code;
  final Show? show;

  const Episode({
    required this.id,
    required this.code,
    this.show,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      id: json['id'] as String,
      code: json['code'] as String,
      show: json['show'] != null 
          ? Show.fromJson(json['show'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      if (show != null) 'show': show!.toJson(),
    };
  }
}