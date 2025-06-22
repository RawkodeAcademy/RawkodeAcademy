package com.rawkode.academy.app.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.rawkode.academy.app.data.model.Article
import com.rawkode.academy.app.ui.theme.RawkodeAcademyAppTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(
    articleId: String?,
    onNavigateBack: () -> Unit
    // viewModel: ArticleDetailViewModel = hiltViewModel() // Example for later
) {
    // In a real app, you'd fetch this from a ViewModel based on articleId
    var article by remember { mutableStateOf<Article?>(null) }

    LaunchedEffect(articleId) {
        if (articleId != null) {
            // Simulate fetching article details
            // In a real app, call viewModel.loadArticle(articleId)
            article = Article( // Sample Data
                id = articleId,
                title = "Sample Article Title for ID: $articleId",
                summary = "This is a sample summary for the article. It gives a brief overview of what the article is about.",
                thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Article+$articleId",
                contentUrl = "https://rawkode.academy/read/$articleId",
                author = "Rawkode",
                publicationDate = "2024-01-01",
                tags = listOf("Sample", "Detail")
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(article?.title ?: "Article") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.Top,
            horizontalAlignment = Alignment.Start
        ) {
            if (article != null) {
                Text("Article Detail for: ${article!!.title}", style = MaterialTheme.typography.headlineSmall)
                Text("ID: ${article!!.id}", style = MaterialTheme.typography.bodyMedium)
                Text("Summary: ${article!!.summary}", style = MaterialTheme.typography.bodyLarge)
                // TODO: Display full article content, perhaps using a WebView or rendering Markdown
            } else if (articleId == null) {
                Text("No article ID provided.")
            } else {
                Text("Loading article details...")
                // TODO: Add a loading indicator
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun ArticleDetailScreenPreview() {
    RawkodeAcademyAppTheme {
        ArticleDetailScreen(articleId = "preview-123", onNavigateBack = {})
    }
}

@Preview(showBackground = true)
@Composable
fun ArticleDetailScreenNullIdPreview() {
    RawkodeAcademyAppTheme {
        ArticleDetailScreen(articleId = null, onNavigateBack = {})
    }
}
