package com.rawkode.academy.app.network

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

object KtorClient {
    val httpClient: HttpClient by lazy {
        HttpClient(CIO) {
            // CIO engine configuration
            engine {
                requestTimeout = 15000 // 15 seconds
            }

            // JSON Serialization
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    isLenient = true
                    ignoreUnknownKeys = true // Useful if the API returns more data than we model
                })
            }

            // TODO: Add other common configurations like default headers, logging, etc.
            // install(Logging) {
            //    logger = Logger.DEFAULT
            //    level = LogLevel.HEADERS
            // }
        }
    }
}
