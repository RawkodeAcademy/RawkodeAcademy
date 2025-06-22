package com.rawkode.academy.app.data.repository

import com.rawkode.academy.app.data.model.Article
import com.rawkode.academy.app.data.model.Video
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SampleContentRepository : ContentRepository {

    private val sampleArticles = listOf(
        Article(
            id = "article-1",
            title = "Understanding Kubernetes Probes",
            summary = "A deep dive into liveness, readiness, and startup probes in Kubernetes. Learn how to configure them effectively for robust application deployment.",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=K8s+Probes", // Placeholder
            contentUrl = "https://rawkode.academy/read/understanding-kubernetes-probes", // Dummy URL
            author = "David McKay",
            publicationDate = "2024-03-10",
            tags = listOf("Kubernetes", "DevOps", "Probes", "Deployment")
        ),
        Article(
            id = "article-2",
            title = "Getting Started with Jetpack Compose",
            summary = "Learn the fundamentals of building beautiful UIs with Jetpack Compose for Android. This guide covers layouts, state management, and theming.",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Jetpack+Compose", // Placeholder
            contentUrl = "https://rawkode.academy/read/getting-started-jetpack-compose", // Dummy URL
            author = "Jane Doe",
            publicationDate = "2024-02-25",
            tags = listOf("Android", "Jetpack Compose", "UI", "Kotlin")
        ),
        Article(
            id = "article-3",
            title = "The Power of Infrastructure as Code with Terraform",
            summary = "Discover how Terraform can help you manage your infrastructure efficiently and reliably. Examples and best practices included.",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Terraform+IaC", // Placeholder
            contentUrl = "https://rawkode.academy/read/power-of-iac-terraform", // Dummy URL
            author = "John Smith",
            publicationDate = "2024-03-01",
            tags = listOf("Terraform", "IaC", "Cloud", "DevOps")
        )
    )

    private val sampleVideos = listOf(
        Video(
            id = "video-1",
            title = "Live Coding: Building a Go Microservice",
            description = "Join us live as we build a microservice from scratch using Go. We'll cover routing, middleware, and database integration.",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Go+Microservice+Live", // Placeholder
            videoUrl = "https://www.youtube.com/watch?v=example1", // Dummy URL
            speaker = "David McKay",
            duration = "1:25:30",
            publicationDate = "2024-03-15",
            tags = listOf("Go", "Microservices", "Live Coding", "Backend")
        ),
        Video(
            id = "video-2",
            title = "Klustered: The Case of the Missing Pods",
            description = "A fun and educational debugging session where we troubleshoot a broken Kubernetes cluster. Can we fix it?",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Klustered+Debug", // Placeholder
            videoUrl = "https://www.youtube.com/watch?v=example2", // Dummy URL
            speaker = "Rawkode & Friends",
            duration = "0:55:12",
            publicationDate = "2024-02-20",
            tags = listOf("Kubernetes", "Debugging", "Klustered", "Troubleshooting")
        ),
        Video(
            id = "video-3",
            title = "Introduction to WebAssembly with Fermyon Spin",
            description = "Explore the future of serverless with WebAssembly and Fermyon Spin. Learn how to build and deploy Wasm applications.",
            thumbnailUrl = "https://via.placeholder.com/600x400.png?text=WASM+Fermyon", // Placeholder
            videoUrl = "https://www.youtube.com/watch?v=example3", // Dummy URL
            speaker = "Michelle Appelson",
            duration = "0:45:00",
            publicationDate = "2024-03-05",
            tags = listOf("WebAssembly", "Serverless", "Fermyon Spin", "Wasm")
        )
    )

    override suspend fun getArticles(): Result<List<Article>> {
        return withContext(Dispatchers.IO) {
            // Simulate network delay
            // kotlinx.coroutines.delay(500)
            Result.success(sampleArticles)
        }
    }

    override suspend fun getArticle(id: String): Result<Article?> {
        return withContext(Dispatchers.IO) {
            // kotlinx.coroutines.delay(200)
            Result.success(sampleArticles.find { it.id == id })
        }
    }

    override suspend fun getVideos(): Result<List<Video>> {
        return withContext(Dispatchers.IO) {
            // kotlinx.coroutines.delay(500)
            Result.success(sampleVideos)
        }
    }

    override suspend fun getVideo(id: String): Result<Video?> {
        return withContext(Dispatchers.IO) {
            // kotlinx.coroutines.delay(200)
            Result.success(sampleVideos.find { it.id == id })
        }
    }
}
