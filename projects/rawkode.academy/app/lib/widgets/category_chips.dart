import 'package:flutter/material.dart';

class CategoryChips extends StatefulWidget {
  const CategoryChips({super.key});

  @override
  State<CategoryChips> createState() => _CategoryChipsState();
}

class _CategoryChipsState extends State<CategoryChips> {
  final List<Map<String, dynamic>> categories = [
    {'name': 'Frontend', 'icon': Icons.web, 'color': Colors.blue},
    {'name': 'Backend', 'icon': Icons.storage, 'color': Colors.green},
    {'name': 'DevOps', 'icon': Icons.cloud, 'color': Colors.orange},
    {'name': 'Mobile', 'icon': Icons.phone_android, 'color': Colors.purple},
    {'name': 'Cloud', 'icon': Icons.cloud_queue, 'color': Colors.cyan},
    {'name': 'Security', 'icon': Icons.security, 'color': Colors.red},
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return Padding(
            padding: EdgeInsets.only(
              left: index == 0 ? 0 : 8,
              right: index == categories.length - 1 ? 0 : 8,
            ),
            child: InkWell(
              onTap: () {
                // Navigate to category videos
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 80,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.grey.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: (category['color'] as Color).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        category['icon'] as IconData,
                        color: category['color'] as Color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      category['name'] as String,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}