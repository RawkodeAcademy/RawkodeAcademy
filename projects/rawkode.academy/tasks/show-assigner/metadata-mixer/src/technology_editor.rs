use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph},
    Terminal,
};
use std::io;
use std::collections::HashSet;

use crate::database::MetadataDatabase;
use crate::graphql::GraphQLClient;
use crate::video::TechnologiesResponse;

enum EditorState {
    Browsing,
    CreatingNew,
}

pub struct TechnologyEditor {
    technologies: Vec<(String, String)>,
    filtered_technologies: Vec<usize>,
    selected_technologies: HashSet<String>,
    search_query: String,
    new_technology_name: String,
    list_state: ListState,
    db: MetadataDatabase,
    state: EditorState,
}

impl TechnologyEditor {
    pub async fn new(db: MetadataDatabase, existing_tech_ids: Vec<String>) -> Result<Self> {
        // Fetch technologies from GraphQL
        let endpoint = "https://api.rawkode.academy/graphql".to_string();
        let graphql_client = GraphQLClient::new(endpoint);
        
        let query = r#"
            query {
                getTechnologies(limit: 500) {
                    id
                    name
                }
            }
        "#;
        
        let response: TechnologiesResponse = graphql_client.query(query, None::<serde_json::Value>).await?;
        let technologies: Vec<(String, String)> = response.technologies
            .into_iter()
            .map(|tech| (tech.id, tech.name))
            .collect();
        
        let filtered_technologies = (0..technologies.len()).collect();
        let selected_technologies: HashSet<String> = existing_tech_ids.into_iter().collect();
        
        let mut list_state = ListState::default();
        if !technologies.is_empty() {
            list_state.select(Some(0));
        }
        
        Ok(Self {
            technologies,
            filtered_technologies,
            selected_technologies,
            search_query: String::new(),
            new_technology_name: String::new(),
            list_state,
            db,
            state: EditorState::Browsing,
        })
    }
    
    pub async fn edit_technologies(&mut self, video_id: &str, video_title: &str) -> Result<Vec<(String, String)>> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;
        
        let result = self.run_editor(&mut terminal, video_id, video_title).await;
        
        disable_raw_mode()?;
        execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
        terminal.show_cursor()?;
        
        result
    }
    
    async fn run_editor<B: ratatui::backend::Backend>(
        &mut self, 
        terminal: &mut Terminal<B>,
        video_id: &str,
        video_title: &str
    ) -> Result<Vec<(String, String)>> {
        loop {
            terminal.draw(|f| match self.state {
                EditorState::Browsing => self.draw_browse_ui(f, video_title),
                EditorState::CreatingNew => self.draw_create_ui(f, video_title),
            })?;
            
            if let Event::Key(key) = event::read()? {
                match self.state {
                    EditorState::Browsing => {
                        match key.code {
                            KeyCode::Esc => {
                                // Save and exit
                                let selected_ids: Vec<String> = self.selected_technologies.iter().cloned().collect();
                                self.db.assign_video_technologies(video_id, &selected_ids).await?;
                                
                                // Return tuples of (id, name) for selected technologies
                                let selected_techs: Vec<(String, String)> = self.selected_technologies
                                    .iter()
                                    .filter_map(|id| {
                                        self.technologies.iter()
                                            .find(|(tech_id, _)| tech_id == id)
                                            .map(|(id, name)| (id.clone(), name.clone()))
                                    })
                                    .collect();
                                
                                return Ok(selected_techs);
                            }
                            KeyCode::Tab => {
                                // Switch to creating new technology if no results found
                                if self.filtered_technologies.is_empty() && !self.search_query.is_empty() {
                                    self.new_technology_name = self.search_query.clone();
                                    self.state = EditorState::CreatingNew;
                                }
                            }
                            KeyCode::Enter | KeyCode::Char(' ') => {
                                if let Some(selected) = self.list_state.selected() {
                                    if selected < self.filtered_technologies.len() {
                                        let tech_idx = self.filtered_technologies[selected];
                                        let (tech_id, _) = &self.technologies[tech_idx];
                                        
                                        if self.selected_technologies.contains(tech_id) {
                                            self.selected_technologies.remove(tech_id);
                                        } else {
                                            self.selected_technologies.insert(tech_id.clone());
                                        }
                                    }
                                }
                            }
                            KeyCode::Down => self.next(),
                            KeyCode::Up => self.previous(),
                            KeyCode::Char(c) => {
                                self.search_query.push(c);
                                self.update_filter();
                            }
                            KeyCode::Backspace => {
                                self.search_query.pop();
                                self.update_filter();
                            }
                            _ => {}
                        }
                    }
                    EditorState::CreatingNew => {
                        match key.code {
                            KeyCode::Esc => {
                                // Cancel and go back to browsing
                                self.state = EditorState::Browsing;
                                self.new_technology_name.clear();
                            }
                            KeyCode::Enter => {
                                if !self.new_technology_name.is_empty() {
                                    // Create the new technology
                                    match self.create_new_technology(&self.new_technology_name).await {
                                        Ok(new_id) => {
                                            // Add to selected technologies
                                            self.selected_technologies.insert(new_id.clone());
                                            // Store the new technology name before clearing
                                            let tech_name = self.new_technology_name.clone();
                                            // Add to local list and sort by name
                                            self.technologies.push((new_id.clone(), tech_name.clone()));
                                            self.technologies.sort_by(|a, b| a.1.cmp(&b.1));
                                            // Keep the search query as the technology name so it shows in results
                                            self.search_query = tech_name;
                                            // Reset state
                                            self.state = EditorState::Browsing;
                                            self.new_technology_name.clear();
                                            // Update filter to show the new technology
                                            self.update_filter();
                                            // Select the newly created technology
                                            if let Some(new_index_in_filtered) = self.filtered_technologies.iter()
                                                .position(|&idx| self.technologies[idx].0 == new_id) {
                                                self.list_state.select(Some(new_index_in_filtered));
                                            }
                                        }
                                        Err(e) => {
                                            // Log error but continue - in a real app we'd show this to the user
                                            eprintln!("Failed to create technology: {}", e);
                                            // Still go back to browsing mode
                                            self.state = EditorState::Browsing;
                                        }
                                    }
                                }
                            }
                            KeyCode::Char(c) => {
                                self.new_technology_name.push(c);
                            }
                            KeyCode::Backspace => {
                                self.new_technology_name.pop();
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }
    
    async fn create_new_technology(&self, name: &str) -> Result<String> {
        // Generate a simple ID from the name
        let id = name
            .to_lowercase()
            .replace(' ', "-")
            .replace(".", "-")
            .replace("/", "-")
            .replace("\\", "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect::<String>();
        
        // Check if ID already exists in our local list
        if self.technologies.iter().any(|(tech_id, _)| tech_id == &id) {
            return Err(anyhow::anyhow!("Technology with ID '{}' already exists", id));
        }
        
        // Create the technology with minimal fields
        self.db.create_technology(&id, name, "", "", "").await?;
        
        Ok(id)
    }
    
    fn draw_browse_ui(&mut self, f: &mut ratatui::Frame, video_title: &str) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Min(10),
                Constraint::Length(3),
            ])
            .split(f.size());
        
        // Title
        let title = Paragraph::new(format!("Edit technologies for: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Search box
        let search = Paragraph::new(format!("Search: {} | Selected: {}", self.search_query, self.selected_technologies.len()))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(search, chunks[1]);
        
        // Technology list
        let items: Vec<ListItem> = self.filtered_technologies
            .iter()
            .map(|&idx| {
                let (tech_id, tech_name) = &self.technologies[idx];
                let is_selected = self.selected_technologies.contains(tech_id);
                let checkbox = if is_selected { "[✓]" } else { "[ ]" };
                ListItem::new(format!("{} {}", checkbox, tech_name))
            })
            .collect();
        
        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Technologies "))
            .highlight_style(
                Style::default()
                    .bg(Color::LightBlue)
                    .add_modifier(Modifier::BOLD)
            );
        
        f.render_stateful_widget(list, chunks[2], &mut self.list_state);
        
        // Help
        let help_text = if self.filtered_technologies.is_empty() && !self.search_query.is_empty() {
            "No results found | Tab: Create new technology | Esc: Save & Exit"
        } else {
            "↑/↓: Navigate | Space/Enter: Toggle | Tab: Create new (when no results) | Esc: Save & Exit"
        };
        let help = Paragraph::new(help_text)
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[3]);
    }
    
    fn draw_create_ui(&self, f: &mut ratatui::Frame, video_title: &str) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Length(5),
                Constraint::Min(5),
                Constraint::Length(3),
            ])
            .split(f.size());
        
        // Title
        let title = Paragraph::new(format!("Create new technology for: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Input field
        let input = Paragraph::new(format!("Technology Name: {}", self.new_technology_name))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL).title(" New Technology "));
        f.render_widget(input, chunks[1]);
        
        // Info
        let info = vec![
            Line::from(""),
            Line::from(vec![
                Span::raw("ID will be generated as: "),
                Span::styled(
                    self.new_technology_name.to_lowercase().replace(' ', "-"),
                    Style::default().fg(Color::Green)
                ),
            ]),
            Line::from(""),
            Line::from("You can add description, website, and documentation later."),
        ];
        let info_widget = Paragraph::new(info)
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center);
        f.render_widget(info_widget, chunks[2]);
        
        // Help
        let help = Paragraph::new("Enter: Create | Esc: Cancel | Type technology name")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[3]);
    }
    
    fn update_filter(&mut self) {
        let query = self.search_query.to_lowercase();
        self.filtered_technologies = self.technologies
            .iter()
            .enumerate()
            .filter(|(_, (_, name))| name.to_lowercase().contains(&query))
            .map(|(idx, _)| idx)
            .collect();
        
        // Reset selection to first item if available
        if !self.filtered_technologies.is_empty() {
            self.list_state.select(Some(0));
        } else {
            self.list_state.select(None);
        }
    }
    
    fn next(&mut self) {
        if self.filtered_technologies.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i >= self.filtered_technologies.len() - 1 {
                    0
                } else {
                    i + 1
                }
            }
            None => 0,
        };
        self.list_state.select(Some(i));
    }
    
    fn previous(&mut self) {
        if self.filtered_technologies.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i == 0 {
                    self.filtered_technologies.len() - 1
                } else {
                    i - 1
                }
            }
            None => 0,
        };
        self.list_state.select(Some(i));
    }
}