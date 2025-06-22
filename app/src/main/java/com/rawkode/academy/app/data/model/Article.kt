package com.rawkode.academy.app.data.model

data class Article(
    val id: String,
    val title: String,
    val summary: String,
    val thumbnailUrl: String?, // URL for a thumbnail image
    val contentUrl: String, // URL to the full article
    val author: String? = null,
    val publicationDate: String? = null, // Could be a Date object later
    val tags: List<String> = emptyList()
)
