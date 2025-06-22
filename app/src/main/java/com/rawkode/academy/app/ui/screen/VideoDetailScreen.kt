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
import com.rawkode.academy.app.data.model.Video
import com.rawkode.academy.app.ui.theme.RawkodeAcademyAppTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoDetailScreen(
    videoId: String?,
    onNavigateBack: () -> Unit
    // viewModel: VideoDetailViewModel = hiltViewModel() // Example for later
) {
    // In a real app, you'd fetch this from a ViewModel based on videoId
    var video by remember { mutableStateOf<Video?>(null) }

    LaunchedEffect(videoId) {
        if (videoId != null) {
            // Simulate fetching video details
            // In a real app, call viewModel.loadVideo(videoId)
            video = Video( // Sample Data
                id = videoId,
                title = "Sample Video Title for ID: $videoId",
                description = "This is a sample description for the video. It explains what the video is about and who the speaker is.",
                thumbnailUrl = "https://via.placeholder.com/600x400.png?text=Video+$videoId",
                videoUrl = "https://www.youtube.com/watch?v=example_$videoId",
                speaker = "Rawkode",
                duration = "0:10:00",
                publicationDate = "2024-01-15",
                tags = listOf("Sample", "Video", "Detail")
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(video?.title ?: "Video") },
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
            if (video != null) {
                Text("Video Detail for: ${video!!.title}", style = MaterialTheme.typography.headlineSmall)
                Text("ID: ${video!!.id}", style = MaterialTheme.typography.bodyMedium)
                Text("Description: ${video!!.description}", style = MaterialTheme.typography.bodyLarge)
                // TODO: Display video player or link to video
            } else if (videoId == null) {
                Text("No video ID provided.")
            } else {
                Text("Loading video details...")
                // TODO: Add a loading indicator
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun VideoDetailScreenPreview() {
    RawkodeAcademyAppTheme {
        VideoDetailScreen(videoId = "preview-456", onNavigateBack = {})
    }
}

@Preview(showBackground = true)
@Composable
fun VideoDetailScreenNullIdPreview() {
    RawkodeAcademyAppTheme {
        VideoDetailScreen(videoId = null, onNavigateBack = {})
    }
}
