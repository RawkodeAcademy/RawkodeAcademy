class Person {
  final String id;
  final String forename;
  final String surname;
  final String? biography;

  const Person({
    required this.id,
    required this.forename,
    required this.surname,
    this.biography,
  });

  String get fullName => '$forename $surname';

  factory Person.fromJson(Map<String, dynamic> json) {
    return Person(
      id: json['id'] as String,
      forename: json['forename'] as String,
      surname: json['surname'] as String,
      biography: json['biography'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'forename': forename,
      'surname': surname,
      if (biography != null) 'biography': biography,
    };
  }
}