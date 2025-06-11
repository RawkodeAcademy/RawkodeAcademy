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

use crate::database::MetadataDatabase;
use crate::graphql::GraphQLClient;
use crate::video::ShowsResponse;

enum EditorState {
    SelectingShow,
    EnteringCode,
}

pub struct ShowEditor {
    pub shows: Vec<(String, String)>,
    filtered_shows: Vec<usize>,
    search_query: String,
    episode_code: String,
    list_state: ListState,
    db: MetadataDatabase,
    state: EditorState,
    selected_show: Option<(String, String)>,
}

impl ShowEditor {
    pub async fn new(db: MetadataDatabase) -> Result<Self> {
        // Fetch shows from GraphQL
        let endpoint = "https://api.rawkode.academy/graphql".to_string();
        let graphql_client = GraphQLClient::new(endpoint);
        
        let query = r#"
            query {
                allShows {
                    id
                    name
                }
            }
        "#;
        
        let response: ShowsResponse = graphql_client.query(query, None::<serde_json::Value>).await?;
        let shows: Vec<(String, String)> = response.shows
            .into_iter()
            .map(|show| (show.id, show.name))
            .collect();
        
        let filtered_shows = (0..shows.len()).collect();
        
        let mut list_state = ListState::default();
        if !shows.is_empty() {
            list_state.select(Some(0));
        }
        
        Ok(Self {
            shows,
            filtered_shows,
            search_query: String::new(),
            episode_code: String::new(),
            list_state,
            db,
            state: EditorState::SelectingShow,
            selected_show: None,
        })
    }
    
    pub async fn select_show(&mut self, video_id: &str, video_title: &str) -> Result<Option<String>> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;
        
        let result = self.run_selection(&mut terminal, video_id, video_title).await;
        
        disable_raw_mode()?;
        execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
        terminal.show_cursor()?;
        
        result
    }
    
    async fn run_selection<B: ratatui::backend::Backend>(
        &mut self, 
        terminal: &mut Terminal<B>,
        video_id: &str,
        video_title: &str
    ) -> Result<Option<String>> {
        loop {
            terminal.draw(|f| {
                match self.state {
                    EditorState::SelectingShow => self.draw_show_selection(f, video_title),
                    EditorState::EnteringCode => self.draw_code_entry(f, video_title),
                }
            })?;
            
            if let Event::Key(key) = event::read()? {
                match self.state {
                    EditorState::SelectingShow => {
                        match key.code {
                            KeyCode::Esc => return Ok(None),
                            KeyCode::Enter => {
                                if let Some(selected) = self.list_state.selected() {
                                    if selected < self.filtered_shows.len() {
                                        let show_idx = self.filtered_shows[selected];
                                        self.selected_show = Some(self.shows[show_idx].clone());
                                        self.state = EditorState::EnteringCode;
                                        self.episode_code.clear();
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
                    EditorState::EnteringCode => {
                        match key.code {
                            KeyCode::Esc => {
                                self.state = EditorState::SelectingShow;
                                self.selected_show = None;
                            }
                            KeyCode::Enter => {
                                if !self.episode_code.is_empty() {
                                    if let Some((show_id, _)) = &self.selected_show {
                                        // Assign the video to the show with the episode code
                                        self.db.assign_video_to_show(video_id, show_id, &self.episode_code).await?;
                                        return Ok(Some(show_id.clone()));
                                    }
                                }
                            }
                            KeyCode::Char(c) => {
                                self.episode_code.push(c.to_ascii_uppercase());
                            }
                            KeyCode::Backspace => {
                                self.episode_code.pop();
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }
    
    fn draw_show_selection(&mut self, f: &mut ratatui::Frame, video_title: &str) {
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
        let title = Paragraph::new(format!("Assign show to: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Search box
        let search = Paragraph::new(format!("Search: {}", self.search_query))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(search, chunks[1]);
        
        // Show list
        let items: Vec<ListItem> = self.filtered_shows
            .iter()
            .map(|&idx| {
                let (_, name) = &self.shows[idx];
                ListItem::new(name.clone())
            })
            .collect();
        
        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" Shows "))
            .highlight_style(
                Style::default()
                    .bg(Color::LightBlue)
                    .add_modifier(Modifier::BOLD)
            );
        
        f.render_stateful_widget(list, chunks[2], &mut self.list_state);
        
        // Help
        let help = Paragraph::new("↑/↓: Navigate | Enter: Select | Esc: Cancel | Type to search")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[3]);
    }
    
    fn draw_code_entry(&self, f: &mut ratatui::Frame, video_title: &str) {
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
        let title = Paragraph::new(format!("Assign show to: {}", video_title))
            .style(Style::default().add_modifier(Modifier::BOLD))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(title, chunks[0]);
        
        // Selected show
        if let Some((_, show_name)) = &self.selected_show {
            let show = Paragraph::new(format!("Show: {}", show_name))
                .style(Style::default().fg(Color::Green))
                .alignment(Alignment::Center)
                .block(Block::default().borders(Borders::ALL));
            f.render_widget(show, chunks[1]);
        }
        
        // Episode code input
        let code = Paragraph::new(format!("Episode Code: {}", self.episode_code))
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(code, chunks[2]);
        
        // Example
        let example = Paragraph::new("Examples: RESTATE1, K8S2, CNCF10")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center);
        f.render_widget(example, chunks[3]);
        
        // Help
        let help = Paragraph::new("Enter: Save | Esc: Back | Type episode code (e.g., RESTATE1)")
            .style(Style::default().fg(Color::Gray))
            .alignment(Alignment::Center)
            .block(Block::default().borders(Borders::ALL));
        f.render_widget(help, chunks[4]);
    }
    
    fn update_filter(&mut self) {
        let query = self.search_query.to_lowercase();
        self.filtered_shows = self.shows
            .iter()
            .enumerate()
            .filter(|(_, (_, name))| name.to_lowercase().contains(&query))
            .map(|(idx, _)| idx)
            .collect();
        
        // Reset selection to first item if available
        if !self.filtered_shows.is_empty() {
            self.list_state.select(Some(0));
        } else {
            self.list_state.select(None);
        }
    }
    
    fn next(&mut self) {
        if self.filtered_shows.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i >= self.filtered_shows.len() - 1 {
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
        if self.filtered_shows.is_empty() {
            return;
        }
        
        let i = match self.list_state.selected() {
            Some(i) => {
                if i == 0 {
                    self.filtered_shows.len() - 1
                } else {
                    i - 1
                }
            }
            None => 0,
        };
        self.list_state.select(Some(i));
    }
}