package com.rawkode.academy.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(8.dp), // Default is 4.dp, Material 3 often uses larger rounding
    large = RoundedCornerShape(16.dp) // Default is 0.dp
)
