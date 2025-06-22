package com.rawkode.academy.app.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object ArticleList : Screen("article_list")
    object VideoList : Screen("video_list")

    // For screens that take arguments
    object ArticleDetail : Screen("article_detail/{articleId}") {
        fun createRoute(articleId: String) = "article_detail/$articleId"
        const val ARG_ARTICLE_ID = "articleId" // Argument key
    }

    object VideoDetail : Screen("video_detail/{videoId}") {
        fun createRoute(videoId: String) = "video_detail/$videoId"
        const val ARG_VIDEO_ID = "videoId" // Argument key
    }
}

// Helper for routes that don't need arguments, makes calls cleaner
fun NavController.navigate(screen: Screen) {
    this.navigate(screen.route)
}

// We need NavController for the helper above.
import androidx.navigation.NavController
