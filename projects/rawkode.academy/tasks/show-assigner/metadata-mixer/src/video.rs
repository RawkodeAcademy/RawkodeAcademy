use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VideoResponse {
    #[serde(rename = "getLatestVideos")]
    pub videos: Vec<Video>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ShowsResponse {
    #[serde(rename = "allShows")]
    pub shows: Vec<ShowInfo>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ShowInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TechnologiesResponse {
    #[serde(rename = "getTechnologies")]
    pub technologies: Vec<TechnologyInfo>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TechnologyInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Video {
    pub id: String,
    pub title: String,
    pub episode: Option<Episode>,
    #[serde(rename = "creditsForRole", default)]
    pub credits_for_role: Vec<Credit>,
    #[serde(default)]
    pub technologies: Vec<Technology>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Episode {
    pub show: Show,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Show {
    #[serde(default)]
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Credit {
    #[serde(rename = "personId")]
    pub person_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub person: Option<Person>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Person {
    #[serde(default)]
    pub forename: String,
    #[serde(default)]
    pub surname: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Technology {
    pub id: Option<String>,
    #[serde(default)]
    pub name: String,
}

impl Video {
    pub fn get_show_name(&self) -> Option<&str> {
        self.episode.as_ref().map(|e| e.show.name.as_str())
    }

    pub fn get_guest_names(&self) -> Vec<String> {
        self.credits_for_role
            .iter()
            .filter_map(|c| {
                if let Some(person) = &c.person {
                    Some(format!("{} {}", person.forename, person.surname))
                } else if let Some(person_id) = &c.person_id {
                    // Just show the ID if we don't have person details
                    Some(format!("[ID: {}]", person_id))
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn get_technology_names(&self) -> Vec<&str> {
        self.technologies.iter().map(|t| t.name.as_str()).collect()
    }

    pub fn has_missing_metadata(&self) -> bool {
        self.episode.is_none() || 
        self.credits_for_role.is_empty() || 
        self.technologies.is_empty()
    }

    pub fn get_metadata_status(&self) -> String {
        let mut status = Vec::new();
        
        if self.episode.is_none() {
            status.push("❌ Show");
        } else {
            status.push("✅ Show");
        }
        
        if self.credits_for_role.is_empty() {
            status.push("❌ Guests");
        } else {
            status.push("✅ Guests");
        }
        
        if self.technologies.is_empty() {
            status.push("❌ Technologies");
        } else {
            status.push("✅ Technologies");
        }
        
        status.join(" | ")
    }
}