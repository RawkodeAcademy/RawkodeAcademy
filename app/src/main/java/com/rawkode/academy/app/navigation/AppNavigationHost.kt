package com.rawkode.academy.app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.rawkode.academy.app.ui.screen.ArticleDetailScreen
import com.rawkode.academy.app.ui.screen.ArticleListScreen
import com.rawkode.academy.app.ui.screen.HomeScreen
import com.rawkode.academy.app.ui.screen.VideoDetailScreen
import com.rawkode.academy.app.ui.screen.VideoListScreen

@Composable
fun AppNavigationHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToArticles = { navController.navigate(Screen.ArticleList.route) },
                onNavigateToVideos = { navController.navigate(Screen.VideoList.route) }
            )
        }
        composable(Screen.ArticleList.route) {
            ArticleListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToArticle = { articleId ->
                    navController.navigate(Screen.ArticleDetail.createRoute(articleId))
                }
            )
        }
        composable(Screen.VideoList.route) {
            VideoListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToVideo = { videoId ->
                    navController.navigate(Screen.VideoDetail.createRoute(videoId))
                }
            )
        }
        composable(
            route = Screen.ArticleDetail.route,
            arguments = listOf(navArgument(Screen.ArticleDetail.ARG_ARTICLE_ID) { type = NavType.StringType })
        ) { backStackEntry ->
            val articleId = backStackEntry.arguments?.getString(Screen.ArticleDetail.ARG_ARTICLE_ID)
            ArticleDetailScreen(
                articleId = articleId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.VideoDetail.route,
            arguments = listOf(navArgument(Screen.VideoDetail.ARG_VIDEO_ID) { type = NavType.StringType })
        ) { backStackEntry ->
            val videoId = backStackEntry.arguments?.getString(Screen.VideoDetail.ARG_VIDEO_ID)
            VideoDetailScreen(
                videoId = videoId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
