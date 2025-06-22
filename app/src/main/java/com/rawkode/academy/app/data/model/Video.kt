package com.rawkode.academy.app.data.model

data class Video(
    val id: String,
    val title: String,
    val description: String,
    val thumbnailUrl: String?, // URL for a video thumbnail
    val videoUrl: String, // URL to the video (e.g., YouTube, Vimeo, or direct file)
    val speaker: String? = null,
    val duration: String? = null, // e.g., "10:35"
    val publicationDate: String? = null, // Could be a Date object later
    val tags: List<String> = emptyList()
)
