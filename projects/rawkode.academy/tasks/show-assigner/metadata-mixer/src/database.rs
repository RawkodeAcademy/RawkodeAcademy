use anyhow::Result;
use libsql::{Builder, Connection};
use std::env;

#[derive(Clone)]
pub struct DatabaseConfig {
    pub base_url: String,
    pub token: String,
}

impl DatabaseConfig {
    pub fn from_env() -> Result<Self> {
        let base_url = env::var("LIBSQL_BASE")
            .unwrap_or_else(|_| "rawkodeacademy.aws-eu-west-1.turso.io".to_string());
        let token = env::var("LIBSQL_TOKEN")?;
        
        Ok(Self { base_url, token })
    }
}

#[derive(Clone)]
pub struct MetadataDatabase {
    episodes_conn: Connection,
    technologies_conn: Connection,
    video_technologies_conn: Connection,
    people_conn: Connection,
    casting_credits_conn: Connection,
}

impl MetadataDatabase {
    pub async fn new(config: DatabaseConfig) -> Result<Self> {
        // Connect to all required databases
        let episodes_url = format!("libsql://episodes-{}", config.base_url);
        let technologies_url = format!("libsql://technologies-{}", config.base_url);
        let video_technologies_url = format!("libsql://video-technologies-{}", config.base_url);
        let people_url = format!("libsql://people-{}", config.base_url);
        let casting_credits_url = format!("libsql://casting-credits-{}", config.base_url);
        
        let episodes_db = Builder::new_remote(episodes_url, config.token.clone()).build().await?;
        let technologies_db = Builder::new_remote(technologies_url, config.token.clone()).build().await?;
        let video_technologies_db = Builder::new_remote(video_technologies_url, config.token.clone()).build().await?;
        let people_db = Builder::new_remote(people_url, config.token.clone()).build().await?;
        let casting_credits_db = Builder::new_remote(casting_credits_url, config.token).build().await?;
        
        Ok(Self {
            episodes_conn: episodes_db.connect()?,
            technologies_conn: technologies_db.connect()?,
            video_technologies_conn: video_technologies_db.connect()?,
            people_conn: people_db.connect()?,
            casting_credits_conn: casting_credits_db.connect()?,
        })
    }
    
    pub async fn get_episode_by_video_id(&self, video_id: &str) -> Result<Option<(String, String)>> {
        let query = "SELECT showId, code FROM episodes WHERE videoId = ?1";
        let mut stmt = self.episodes_conn.prepare(query).await?;
        let mut rows = stmt.query([video_id]).await?;
        
        if let Some(row) = rows.next().await? {
            let show_id: String = row.get(0)?;
            let code: String = row.get(1)?;
            Ok(Some((show_id, code)))
        } else {
            Ok(None)
        }
    }
    
    pub async fn get_video_guests(&self, video_id: &str) -> Result<Vec<(String, String, String)>> {
        // First get person IDs from casting-credits
        let query = "SELECT person_id FROM `casting-credits` WHERE video_id = ?1 AND role = 'guest'";
        let mut stmt = self.casting_credits_conn.prepare(query).await?;
        let mut rows = stmt.query([video_id]).await?;
        let mut person_ids = Vec::new();
        
        while let Some(row) = rows.next().await? {
            let person_id: String = row.get(0)?;
            person_ids.push(person_id);
        }
        
        // Then fetch person details
        let mut guests = Vec::new();
        for person_id in person_ids {
            let person_query = "SELECT forename, surname FROM people WHERE id = ?1";
            let mut person_stmt = self.people_conn.prepare(person_query).await?;
            let mut person_rows = person_stmt.query([&person_id]).await?;
            
            if let Some(person_row) = person_rows.next().await? {
                let forename: String = person_row.get(0)?;
                let surname: String = person_row.get(1)?;
                guests.push((person_id, forename, surname));
            }
        }
        
        Ok(guests)
    }
    
    pub async fn get_video_technologies(&self, video_id: &str) -> Result<Vec<(String, String)>> {
        // First get technology IDs from video_technologies
        let query = "SELECT technology_id FROM video_technologies WHERE video_id = ?1";
        let mut stmt = self.video_technologies_conn.prepare(query).await?;
        let mut rows = stmt.query([video_id]).await?;
        let mut tech_ids = Vec::new();
        
        while let Some(row) = rows.next().await? {
            let tech_id: String = row.get(0)?;
            tech_ids.push(tech_id);
        }
        
        // Then fetch technology details
        let mut techs = Vec::new();
        for tech_id in tech_ids {
            let tech_query = "SELECT name FROM technologies WHERE id = ?1";
            let mut tech_stmt = self.technologies_conn.prepare(tech_query).await?;
            let mut tech_rows = tech_stmt.query([&tech_id]).await?;
            
            if let Some(tech_row) = tech_rows.next().await? {
                let tech_name: String = tech_row.get(0)?;
                techs.push((tech_id, tech_name));
            }
        }
        
        Ok(techs)
    }
    
    pub async fn get_episode_by_video_id(&self, video_id: &str) -> Result<Option<(String, String)>> {
        let query = "SELECT showId, code FROM episodes WHERE videoId = ?1";
        let mut stmt = self.episodes_conn.prepare(query).await?;
        let mut rows = stmt.query([video_id]).await?;
        
        if let Some(row) = rows.next().await? {
            let show_id: String = row.get(0)?;
            let code: String = row.get(1)?;
            Ok(Some((show_id, code)))
        } else {
            Ok(None)
        }
    }
    
    pub async fn get_show_name_by_id(&self, show_id: &str) -> Result<Option<String>> {
        // Since we don't have access to the shows data directly, we'll need to 
        // fetch it from GraphQL or hardcode some known shows
        // For now, let's return the show_id as a placeholder
        Ok(Some(show_id.to_string()))
    }
    
    pub async fn assign_video_to_show(&self, video_id: &str, show_id: &str, episode_code: &str) -> Result<()> {
        // First check if the assignment already exists
        let check_query = "SELECT COUNT(*) FROM episodes WHERE videoId = ?1";
        let mut stmt = self.episodes_conn.prepare(check_query).await?;
        let mut rows = stmt.query([video_id]).await?;
        
        if let Some(row) = rows.next().await? {
            let count: i64 = row.get(0)?;
            if count > 0 {
                // Update existing assignment
                let update_query = "UPDATE episodes SET showId = ?1, code = ?2 WHERE videoId = ?3";
                self.episodes_conn.execute(update_query, [show_id, episode_code, video_id]).await?;
                return Ok(());
            }
        }
        
        // Insert new assignment
        let insert_query = "INSERT INTO episodes (videoId, showId, code) VALUES (?1, ?2, ?3)";
        self.episodes_conn.execute(insert_query, [video_id, show_id, episode_code]).await?;
        
        Ok(())
    }
    
    pub async fn assign_video_technologies(&self, video_id: &str, technology_ids: &[String]) -> Result<()> {
        // First, remove existing technology assignments for this video
        let delete_query = "DELETE FROM video_technologies WHERE video_id = ?1";
        self.video_technologies_conn.execute(delete_query, [video_id]).await?;
        
        // Then insert the new assignments
        for tech_id in technology_ids {
            let insert_query = "INSERT INTO video_technologies (video_id, technology_id) VALUES (?1, ?2)";
            self.video_technologies_conn.execute(insert_query, [video_id, tech_id]).await?;
        }
        
        Ok(())
    }
    
    pub async fn create_technology(&self, id: &str, name: &str, description: &str, website: &str, documentation: &str) -> Result<()> {
        // Use INSERT OR IGNORE to handle cases where the technology might already exist
        let insert_query = "INSERT OR IGNORE INTO technologies (id, name, description, website, documentation) VALUES (?1, ?2, ?3, ?4, ?5)";
        self.technologies_conn.execute(insert_query, [id, name, description, website, documentation]).await?;
        Ok(())
    }
    
    pub async fn get_all_people(&self) -> Result<Vec<(String, String, String)>> {
        let mut stmt = self.people_conn
            .prepare("SELECT id, forename, surname FROM people ORDER BY forename, surname")
            .await?;
        
        let mut rows = stmt.query(()).await?;
        let mut people = Vec::new();
        
        while let Some(row) = rows.next().await? {
            let id: String = row.get(0)?;
            let forename: String = row.get(1)?;
            let surname: String = row.get(2)?;
            people.push((id, forename, surname));
        }
        
        Ok(people)
    }
    
    pub async fn create_person(&self, id: &str, forename: &str, surname: &str) -> Result<()> {
        let insert_query = "INSERT OR IGNORE INTO people (id, forename, surname) VALUES (?1, ?2, ?3)";
        self.people_conn.execute(insert_query, [id, forename, surname]).await?;
        Ok(())
    }
    
    pub async fn assign_video_guests(&self, video_id: &str, person_ids: &[String]) -> Result<()> {
        // Log what we're trying to do
        eprintln!("Assigning {} guests to video {}", person_ids.len(), video_id);
        
        // First, remove existing guest assignments for this video
        // Only remove entries with role='guest'
        let delete_query = "DELETE FROM `casting-credits` WHERE video_id = ?1 AND role = 'guest'";
        match self.casting_credits_conn.execute(delete_query, [video_id]).await {
            Ok(rows) => eprintln!("Deleted {} existing guest assignments", rows),
            Err(e) => eprintln!("Error deleting existing assignments: {}", e),
        }
        
        // Then insert the new assignments with role='guest'
        for (idx, person_id) in person_ids.iter().enumerate() {
            eprintln!("Inserting guest {} of {}: {}", idx + 1, person_ids.len(), person_id);
            let insert_query = "INSERT INTO `casting-credits` (person_id, role, video_id) VALUES (?1, 'guest', ?2)";
            match self.casting_credits_conn.execute(insert_query, [person_id, video_id]).await {
                Ok(_) => eprintln!("  Successfully inserted"),
                Err(e) => {
                    eprintln!("  Error inserting: {}", e);
                    return Err(anyhow::anyhow!("Failed to insert guest {}: {}", person_id, e));
                }
            }
        }
        
        eprintln!("Successfully assigned all {} guests", person_ids.len());
        Ok(())
    }
}