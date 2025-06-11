class Technology {
  final String id;
  final String name;
  final String? description;
  final String? logo;
  final String? website;

  const Technology({
    required this.id,
    required this.name,
    this.description,
    this.logo,
    this.website,
  });

  factory Technology.fromJson(Map<String, dynamic> json) {
    return Technology(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      logo: json['logo'] as String?,
      website: json['website'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (description != null) 'description': description,
      if (logo != null) 'logo': logo,
      if (website != null) 'website': website,
    };
  }
}