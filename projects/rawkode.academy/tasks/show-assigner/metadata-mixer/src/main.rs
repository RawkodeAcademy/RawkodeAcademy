mod browser;
mod database;
mod editor;
mod graphql;
mod guest_editor;
mod technology_editor;
mod video;

use anyhow::Result;
use clap::{Parser, Subcommand};
use serde_json::Value;

use crate::browser::VideoBrowser;
use crate::database::{DatabaseConfig, MetadataDatabase};
use crate::graphql::GraphQLClient;
use crate::video::VideoResponse;

#[derive(Parser)]
#[command(name = "graphql-libsql-cli")]
#[command(about = "A CLI tool to query GraphQL and insert data into libSQL", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Browse,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Browse => {
            let endpoint = "https://api.rawkode.academy/graphql".to_string();
            let graphql_client = GraphQLClient::new(endpoint);
            
            let query = r#"
                query {
                    getLatestVideos(limit: 500) {
                        id
                        title
                        technologies {
                            id
                            name
                        }
                    }
                }
            "#;

            println!("Fetching videos...");
            
            // First get the raw response to debug
            let raw_response: Value = graphql_client.query(query, None::<Value>).await?;
            
            // Try to parse it
            let response: VideoResponse = match serde_json::from_value(raw_response.clone()) {
                Ok(r) => r,
                Err(e) => {
                    // Save the raw response for debugging
                    std::fs::write("debug_response.json", serde_json::to_string_pretty(&raw_response)?)?;
                    eprintln!("Failed to parse response: {}", e);
                    eprintln!("Raw response saved to debug_response.json");
                    return Err(e.into());
                }
            };
            
            println!("Found {} videos", response.videos.len());
            
            // Initialize database connection
            println!("Connecting to metadata databases...");
            let db_config = DatabaseConfig::from_env()?;
            let db = MetadataDatabase::new(db_config).await?;
            
            // Fetch all shows for mapping
            println!("Fetching show information...");
            let shows_query = r#"
                query {
                    allShows {
                        id
                        name
                    }
                }
            "#;
            
            let shows_response: crate::video::ShowsResponse = graphql_client.query(shows_query, None::<Value>).await?;
            let shows_map: std::collections::HashMap<String, String> = shows_response.shows
                .into_iter()
                .map(|show| (show.id, show.name))
                .collect();
            
            // Enrich videos with data from database
            println!("Loading metadata from database...");
            let mut enriched_videos = response.videos;
            for video in &mut enriched_videos {
                // Load episode data
                if let Ok(Some((show_id, code))) = db.get_episode_by_video_id(&video.id).await {
                    if let Some(show_name) = shows_map.get(&show_id) {
                        video.episode = Some(crate::video::Episode {
                            show: crate::video::Show {
                                name: show_name.clone(),
                            },
                            code: Some(code),
                        });
                    }
                }
                
                // Load guest data
                if let Ok(guests) = db.get_video_guests(&video.id).await {
                    video.credits_for_role = guests.into_iter().map(|(person_id, forename, surname)| {
                        crate::video::Credit {
                            person_id: Some(person_id),
                            person: Some(crate::video::Person {
                                forename,
                                surname,
                            }),
                        }
                    }).collect();
                }
                
                // Load technology data (only if not already present from GraphQL)
                if video.technologies.is_empty() {
                    if let Ok(techs) = db.get_video_technologies(&video.id).await {
                        video.technologies = techs.into_iter().map(|(tech_id, tech_name)| {
                            crate::video::Technology {
                                id: Some(tech_id),
                                name: tech_name,
                            }
                        }).collect();
                    }
                }
            }

            let mut browser = VideoBrowser::new(enriched_videos, db);
            browser.run().await?;
        }
    }

    Ok(())
}

