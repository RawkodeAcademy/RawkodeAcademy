import 'package:rawkode_academy/models/video.dart';

class MockDataService {
  static List<Video> getMockVideos() {
    return [
      Video(
        id: '1',
        title: 'Introduction to Kubernetes',
        thumbnailUrl: 'https://i.ytimg.com/vi/QJ4fODH6DXI/maxresdefault.jpg',
        description: 'Learn the basics of Kubernetes and how to deploy your first application.',
        subtitle: 'A beginner-friendly guide',
        slug: 'introduction-to-kubernetes',
        streamUrl: 'https://cdn.rawkode.academy/videos/introduction-to-kubernetes.m3u8',
        duration: 3600,
        likes: 1250,
        publishedAt: '2023-01-15',
        chapters: [
          Chapter(
            title: 'Introduction',
            startTime: 0,
          ),
          Chapter(
            title: 'Kubernetes Architecture',
            startTime: 300,
          ),
          Chapter(
            title: 'Deploying Your First App',
            startTime: 600,
          ),
        ],
        episode: Episode(
          id: 'ep1',
          code: 'K8S-101',
          show: Show(
            id: 'show1',
            name: 'Cloud Native Show',
            hosts: [
              Person(
                id: 'person1',
                forename: 'David',
                surname: 'McKay',
                biography: 'Cloud Native enthusiast and educator',
                links: [
                  Link(
                    name: 'Twitter',
                    url: 'https://twitter.com/rawkode',
                  ),
                  Link(
                    name: 'GitHub',
                    url: 'https://github.com/rawkode',
                  ),
                ],
              ),
            ],
          ),
        ),
        credits: [
          CastingCredit(
            person: Person(
              id: 'person1',
              forename: 'David',
              surname: 'McKay',
            ),
          ),
        ],
      ),
      Video(
        id: '2',
        title: 'Docker Fundamentals',
        thumbnailUrl: 'https://i.ytimg.com/vi/rOTqprHv1YE/maxresdefault.jpg',
        description: 'A comprehensive guide to Docker containers and how to use them effectively.',
        subtitle: 'Master containerization',
        slug: 'docker-fundamentals',
        streamUrl: 'https://cdn.rawkode.academy/videos/docker-fundamentals.m3u8',
        duration: 2700,
        likes: 980,
        publishedAt: '2023-02-20',
        chapters: [
          Chapter(
            title: 'What are Containers?',
            startTime: 0,
          ),
          Chapter(
            title: 'Docker CLI',
            startTime: 240,
          ),
          Chapter(
            title: 'Building Images',
            startTime: 480,
          ),
          Chapter(
            title: 'Docker Compose',
            startTime: 720,
          ),
        ],
      ),
      Video(
        id: '3',
        title: 'Terraform for Beginners',
        thumbnailUrl: 'https://i.ytimg.com/vi/SLB_c_ayRMo/maxresdefault.jpg',
        description: 'Get started with Infrastructure as Code using Terraform.',
        subtitle: 'IaC made simple',
        slug: 'terraform-for-beginners',
        streamUrl: 'https://cdn.rawkode.academy/videos/terraform-for-beginners.m3u8',
        duration: 3200,
        likes: 1100,
        publishedAt: '2023-03-10',
        chapters: [
          Chapter(
            title: 'What is IaC?',
            startTime: 0,
          ),
          Chapter(
            title: 'Terraform Basics',
            startTime: 180,
          ),
          Chapter(
            title: 'Creating Resources',
            startTime: 360,
          ),
          Chapter(
            title: 'Terraform State',
            startTime: 540,
          ),
          Chapter(
            title: 'Modules',
            startTime: 720,
          ),
        ],
      ),
      Video(
        id: '4',
        title: 'GitOps with Flux',
        thumbnailUrl: 'https://i.ytimg.com/vi/0v5bjysXTL8/maxresdefault.jpg',
        description: 'Learn how to implement GitOps workflows using Flux CD.',
        subtitle: 'Modern deployment strategies',
        slug: 'gitops-with-flux',
        streamUrl: 'https://cdn.rawkode.academy/videos/gitops-with-flux.m3u8',
        duration: 2800,
        likes: 750,
        publishedAt: '2023-04-05',
        chapters: [
          Chapter(
            title: 'GitOps Introduction',
            startTime: 0,
          ),
          Chapter(
            title: 'Flux Architecture',
            startTime: 300,
          ),
          Chapter(
            title: 'Setting Up Flux',
            startTime: 600,
          ),
          Chapter(
            title: 'Automating Deployments',
            startTime: 900,
          ),
        ],
      ),
      Video(
        id: '5',
        title: 'Prometheus Monitoring',
        thumbnailUrl: 'https://i.ytimg.com/vi/h4Sl21AKiDg/maxresdefault.jpg',
        description: 'Set up comprehensive monitoring for your applications using Prometheus.',
        subtitle: 'Observability essentials',
        slug: 'prometheus-monitoring',
        streamUrl: 'https://cdn.rawkode.academy/videos/prometheus-monitoring.m3u8',
        duration: 3400,
        likes: 890,
        publishedAt: '2023-05-20',
        chapters: [
          Chapter(
            title: 'Monitoring Basics',
            startTime: 0,
          ),
          Chapter(
            title: 'Prometheus Architecture',
            startTime: 240,
          ),
          Chapter(
            title: 'PromQL',
            startTime: 480,
          ),
          Chapter(
            title: 'Alerting',
            startTime: 720,
          ),
          Chapter(
            title: 'Grafana Integration',
            startTime: 960,
          ),
        ],
      ),
    ];
  }
}
