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
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph},
    Terminal,
};
use std::io;
use std::collections::HashSet;

use crate::database::MetadataDatabase;

enum EditorState {
    Browsing,
    EnteringForename,
    EnteringSurname,
}

pub struct GuestEditor {
    people: Vec<(String, String, String)>, // (id, forename, surname)
    filtered_people: Vec<usize>,
    selected_people: HashSet<String>,
    search_query: String,
    new_forename: String,
    new_surname: String,
    list_state: ListState,
    db: MetadataDatabase,
    state: EditorState,
}

impl GuestEditor {
    pub async fn new(db: MetadataDatabase, existing_person_ids: Vec<String>) -> Result<Self> {
        // Fetch people from database
        let people = db.get_all_people().await?;
        let filtered_people = (0..people.len()).collect();
        let selected_people: HashSet<String> = existing_person_ids.into_iter().collect();
        
        let mut list_state = ListState::default();
        if !people.is_empty() {
            list_state.select(Some(0));
        }
        
        Ok(Self {
            people,
            filtered_people,
            selected_people,
            search_query: String::new(),
            new_forename: String::new(),
            new_surname: String::new(),
            list_state,
            db,
            state: EditorState::Browsing,
        })
    }
    
    pub async fn edit_guests(&mut self, video_id: &str, video_title: &str) -> Result<Vec<(String, String, String)>> {
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
    ) -> Result<Vec<(String, String, String)>> {
        loop {
            terminal.draw(|f| match self.state {
                EditorState::Browsing => self.draw_browse_ui(f, video_title),
                EditorState::EnteringForename => self.draw_create_forename_ui(f, video_title),
                EditorState::EnteringSurname => self.draw_create_surname_ui(f, video_title),
            })?;
            
            if let Event::Key(key) = event::read()? {
                match self.state {
                    EditorState::Browsing => {
                        match key.code {
                            KeyCode::Esc => {
                                // Save and exit
                                let selected_ids: Vec<String> = self.selected_people.iter().cloned().collect();
                                self.db.assign_video_guests(video_id, &selected_ids).await?;
                                
                                // Return tuples of (id, forename, surname) for selected people
                                let selected_people: Vec<(String, String, String)> = self.selected_people
                                    .iter()
                                    .filter_map(|id| {
                                        self.people.iter()
                                            .find(|(person_id, _, _)| person_id == id)
                                            .cloned()
                                    })
                                    .collect();
                                
                                return Ok(selected_people);
                            }
                            KeyCode::Tab => {
                                // Switch to creating new person if no results found
                                if self.filtered_people.is_empty() && !self.search_query.is_empty() {
                                    // Try to parse the search query as "forename surname"
                                    let parts: Vec<&str> = self.search_query.split_whitespace().collect();
                                    if parts.len() >= 2 {
                                        self.new_forename = parts[0].to_string();
                                        self.new_surname = parts[1..].join(" ");
                                        self.state = EditorState::EnteringSurname;
                                    } else {
                                        self.new_forename = self.search_query.clone();
                                        self.new_surname.clear();
                                        self.state = EditorState::EnteringForename;
                                    }
                                }
                            }
                            KeyCode::Enter | KeyCode::Char(' ') => {
                                if let Some(selected) = self.list_state.selected() {
                                    if selected < self.filtered_people.len() {
                                        let person_idx = self.filtered_people[selected];
                                        let (person_id, _, _) = &self.people[person_idx];
                                        
                                        if self.selected_people.contains(person_id) {
                                            self.selected_people.remove(person_id);
                                        } else {
                                            self.selected_people.insert(person_id.clone());
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
                    EditorState::EnteringForename => {
                        match key.code {
                            KeyCode::Esc => {
                                // Cancel and go back to browsing
                                self.state = EditorState::Browsing;
                                self.new_forename.clear();
                                self.new_surname.clear();
                            }
                            KeyCode::Enter => {
                                if !self.new_forename.is_empty() {
                                    self.state = EditorState::EnteringSurname;
                                }
                            }
                            KeyCode::Char(c) => {
                                self.new_forename.push(c);
                            }
                            KeyCode::Backspace => {
                                self.new_forename.pop();
                            }
                            _ => {}
                        }
                    }
                    EditorState::EnteringSurname => {
                        match key.code {
                            KeyCode::Esc => {
                                // Go back to entering forename
                                self.state = EditorState::EnteringForename;
                            }
                            KeyCode::Enter => {
                                if !self.new_forename.is_empty() && !self.new_surname.is_empty() {
                                    // Create the new person
                                    match self.create_new_person(&self.new_forename, &self.new_surname).await {
                                        Ok(new_id) => {
                                            // Add to selected people
                                            self.selected_people.insert(new_id.clone());
                                            // Store the person info
                                            let forename = self.new_forename.clone();
                                            let surname = self.new_surname.clone();
                                            // Add to local list and sort
                                            self.people.push((new_id.clone(), forename.clone(), surname.clone()));
                                            self.people.sort_by(|a, b| {
                                                a.1.cmp(&b.1).then_with(|| a.2.cmp(&b.2))
                                            });
                                            // Keep the search query to show the new person
                                            self.search_query = format!("{} {}", forename, surname);
                                            // Reset state
                                            self.state = EditorState::Browsing;
                                            self.new_forename.clear();
                                            self.new_surname.clear();
                                            // Update filter to show the new person
                                            self.update_filter();
                                            // Select the newly created person
                                            if let Some(new_index_in_filtered) = self.filtered_people.iter()
                                                .position(|&idx| self.people[idx].0 == new_id) {
                                                self.list_state.select(Some(new_index_in_filtered));
                                            }
                                        }
                                        Err(e) => {
                                            eprintln!("Failed to create person: {}", e);
                                            self.state = EditorState::Browsing;
                                        }
                                    }
                                }
                            }
                            KeyCode::Char(c) => {
                                self.new_surname.push(c);
                            }
                            KeyCode::Backspace => {
                                self.new_surname.pop();
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }
    
    async fn create_new_person(&self, forename: &str, surname: &str) -> Result<String> {
        // Generate a unique ID using cuid2
        let id = cuid2::create_id();
        
        // Create the person
        self.db.create_person(&id, forename, surname).await?;
        
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
        let title = Paragraph::new(format!("Edit guests for: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Search box
        let search = Paragraph::new(format!("Search: {} | Selected: {}", self.search_query, self.selected_people.len()))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(search, chunks[1]);
        
        // People list
        let items: Vec<ListItem> = self.filtered_people
            .iter()
            .map(|&idx| {
                let (person_id, forename, surname) = &self.people[idx];
                let is_selected = self.selected_people.contains(person_id);
                let checkbox = if is_selected { "[✓]" } else { "[ ]" };
                ListItem::new(format!("{} {} {}", checkbox, forename, surname))
            })
            .collect();
        
        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" People "))
            .highlight_style(
                Style::default()
                    .bg(Color::LightBlue)
                    .add_modifier(Modifier::BOLD)
            );
        
        f.render_stateful_widget(list, chunks[2], &mut self.list_state);
        
        // Help
        let help_text = if self.filtered_people.is_empty() && !self.search_query.is_empty() {
            "No results found | Tab: Create new person | Esc: Save & Exit"
        } else {
            "↑/↓: Navigate | Space/Enter: Toggle | Tab: Create new (when no results) | Esc: Save & Exit"
        };
        let help = Paragraph::new(help_text)
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[3]);
    }
    
    fn draw_create_forename_ui(&self, f: &mut ratatui::Frame, video_title: &str) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Min(5),
                Constraint::Length(3),
            ])
            .split(f.size());
        
        // Title
        let title = Paragraph::new(format!("Create new guest for: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Forename input
        let input = Paragraph::new(format!("Forename: {}", self.new_forename))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL).title(" New Person "));
        f.render_widget(input, chunks[1]);
        
        // Help
        let help = Paragraph::new("Enter: Continue to surname | Esc: Cancel | Type forename")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[3]);
    }
    
    fn draw_create_surname_ui(&self, f: &mut ratatui::Frame, video_title: &str) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Length(3),
                Constraint::Min(5),
                Constraint::Length(3),
            ])
            .split(f.size());
        
        // Title
        let title = Paragraph::new(format!("Create new guest for: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Forename display
        let forename = Paragraph::new(format!("Forename: {}", self.new_forename))
            .style(Style::default().fg(Color::Green))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(forename, chunks[1]);
        
        // Surname input
        let input = Paragraph::new(format!("Surname: {}", self.new_surname))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(input, chunks[2]);
        
        // Help
        let help = Paragraph::new("Enter: Create | Esc: Back | Type surname")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[4]);
    }
    
    fn update_filter(&mut self) {
        let query = self.search_query.to_lowercase();
        self.filtered_people = self.people
            .iter()
            .enumerate()
            .filter(|(_, (_, forename, surname))| {
                let full_name = format!("{} {}", forename, surname).to_lowercase();
                full_name.contains(&query) || 
                forename.to_lowercase().contains(&query) || 
                surname.to_lowercase().contains(&query)
            })
            .map(|(idx, _)| idx)
            .collect();
        
        // Reset selection to first item if available
        if !self.filtered_people.is_empty() {
            self.list_state.select(Some(0));
        } else {
            self.list_state.select(None);
        }
    }
    
    fn next(&mut self) {
        if self.filtered_people.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i >= self.filtered_people.len() - 1 {
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
        if self.filtered_people.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i == 0 {
                    self.filtered_people.len() - 1
                } else {
                    i - 1
                }
            }
            None => 0,
        };
        self.list_state.select(Some(i));
    }
}