package com.rawkode.academy.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.rawkode.academy.app.navigation.AppNavigationHost
import com.rawkode.academy.app.ui.theme.RawkodeAcademyAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            RawkodeAcademyAppTheme {
                val navController = rememberNavController()
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigationHost(navController = navController)
                }
            }
        }
    }
}

// Preview of the app with navigation can be more complex
// For now, the individual screen previews are more useful.
// We can add a preview for the AppNavigationHost if needed,
// but it might require a more involved setup.
