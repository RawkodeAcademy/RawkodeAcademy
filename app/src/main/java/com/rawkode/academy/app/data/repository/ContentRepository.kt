package com.rawkode.academy.app.data.repository

import com.rawkode.academy.app.data.model.Article
import com.rawkode.academy.app.data.model.Video

interface ContentRepository {
    suspend fun getArticles(): Result<List<Article>>
    suspend fun getArticle(id: String): Result<Article?>

    suspend fun getVideos(): Result<List<Video>>
    suspend fun getVideo(id: String): Result<Video?>
}
