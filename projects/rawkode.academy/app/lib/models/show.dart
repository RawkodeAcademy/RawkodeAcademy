import 'package:rawkode_academy/models/person.dart';

class Show {
  final String id;
  final String name;
  final List<Person> hosts;

  const Show({
    required this.id,
    required this.name,
    required this.hosts,
  });

  factory Show.fromJson(Map<String, dynamic> json) {
    return Show(
      id: json['id'] as String,
      name: json['name'] as String,
      hosts: (json['hosts'] as List<dynamic>?)
          ?.map((host) => Person.fromJson(host as Map<String, dynamic>))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'hosts': hosts.map((host) => host.toJson()).toList(),
    };
  }
}