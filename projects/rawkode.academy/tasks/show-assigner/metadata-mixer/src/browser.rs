use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Wrap},
    Terminal,
};
use std::io;

use crate::database::MetadataDatabase;
use crate::editor::ShowEditor;
use crate::guest_editor::GuestEditor;
use crate::technology_editor::TechnologyEditor;
use crate::video::Video;

pub struct VideoBrowser {
    videos: Vec<Video>,
    current_index: usize,
    filter_missing_only: bool,
    db: MetadataDatabase,
}

impl VideoBrowser {
    pub fn new(videos: Vec<Video>, db: MetadataDatabase) -> Self {
        Self {
            videos,
            current_index: 0,
            filter_missing_only: false,
            db,
        }
    }

    pub async fn run(&mut self) -> Result<()> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        let result = self.run_app(&mut terminal).await;

        disable_raw_mode()?;
        execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
        terminal.show_cursor()?;

        result
    }

    async fn run_app<B: ratatui::backend::Backend>(&mut self, terminal: &mut Terminal<B>) -> Result<()> {
        loop {
            terminal.draw(|f| self.ui(f))?;

            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') | KeyCode::Esc => break,
                    KeyCode::Char('j') | KeyCode::Down => self.next_video(),
                    KeyCode::Char('k') | KeyCode::Up => self.previous_video(),
                    KeyCode::Char('f') => self.toggle_filter(),
                    KeyCode::Char('s') => self.edit_show().await?,
                    KeyCode::Char('g') => self.edit_guests().await?,
                    KeyCode::Char('t') => self.edit_technologies().await?,
                    KeyCode::Char(' ') => self.next_video_with_missing_metadata(),
                    _ => {}
                }
            }
        }
        Ok(())
    }

    fn ui(&self, f: &mut ratatui::Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Min(10),
                Constraint::Length(3),
                Constraint::Length(5),
            ])
            .split(f.size());

        self.render_video_details(f, chunks[0]);
        self.render_navigation(f, chunks[1]);
        self.render_help(f, chunks[2]);
    }

    fn render_video_details(&self, f: &mut ratatui::Frame, area: Rect) {
        let videos = self.get_filtered_videos();
        if videos.is_empty() || self.current_index >= videos.len() {
            let no_videos = Paragraph::new("No videos found")
                .style(Style::default().fg(Color::Red))
                .alignment(Alignment::Center);
            f.render_widget(no_videos, area);
            return;
        }

        let video = &videos[self.current_index];
        
        let mut lines = vec![
            Line::from(vec![
                Span::styled("Title: ", Style::default().add_modifier(Modifier::BOLD)),
                Span::raw(&video.title),
            ]),
            Line::from(""),
            Line::from(vec![
                Span::styled("Status: ", Style::default().add_modifier(Modifier::BOLD)),
                Span::raw(video.get_metadata_status()),
            ]),
            Line::from(""),
        ];

        if let Some(show) = video.get_show_name() {
            let show_text = if let Some(episode) = &video.episode {
                if let Some(code) = &episode.code {
                    format!("{} [{}]", show, code)
                } else {
                    show.to_string()
                }
            } else {
                show.to_string()
            };
            lines.push(Line::from(vec![
                Span::styled("Show: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Green)),
                Span::raw(show_text),
            ]));
        } else {
            lines.push(Line::from(vec![
                Span::styled("Show: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Red)),
                Span::styled("Not assigned", Style::default().fg(Color::Red)),
            ]));
        }

        let guests = video.get_guest_names();
        if !guests.is_empty() {
            lines.push(Line::from(vec![
                Span::styled("Guests: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Green)),
                Span::raw(guests.join(", ")),
            ]));
        } else {
            lines.push(Line::from(vec![
                Span::styled("Guests: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Red)),
                Span::styled("None", Style::default().fg(Color::Red)),
            ]));
        }

        let techs = video.get_technology_names();
        if !techs.is_empty() {
            lines.push(Line::from(vec![
                Span::styled("Technologies: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Green)),
                Span::raw(techs.join(", ")),
            ]));
        } else {
            lines.push(Line::from(vec![
                Span::styled("Technologies: ", Style::default().add_modifier(Modifier::BOLD).fg(Color::Red)),
                Span::styled("None", Style::default().fg(Color::Red)),
            ]));
        }

        let block = Block::default()
            .title(format!(" Video {} of {} ", self.current_index + 1, videos.len()))
            .borders(Borders::ALL);

        let paragraph = Paragraph::new(lines)
            .block(block)
            .wrap(Wrap { trim: true });

        f.render_widget(paragraph, area);
    }

    fn render_navigation(&self, f: &mut ratatui::Frame, area: Rect) {
        let nav_text = if self.filter_missing_only {
            "Filter: Missing Metadata Only"
        } else {
            "Filter: All Videos"
        };

        let navigation = Paragraph::new(nav_text)
            .style(Style::default().fg(Color::Yellow))
            .block(Block::default().borders(Borders::ALL).title(" Navigation "))
            .alignment(Alignment::Center);

        f.render_widget(navigation, area);
    }

    fn render_help(&self, f: &mut ratatui::Frame, area: Rect) {
        let help_items = vec![
            "j/↓: Next | k/↑: Previous | Space: Next Missing",
            "s: Edit Show | g: Edit Guests | t: Edit Technologies",
            "f: Toggle Filter | q/Esc: Quit",
        ];

        let help = Paragraph::new(help_items.join("\n"))
            .style(Style::default().fg(Color::Gray))
            .block(Block::default().borders(Borders::ALL).title(" Help "))
            .alignment(Alignment::Center);

        f.render_widget(help, area);
    }

    fn get_filtered_videos(&self) -> Vec<&Video> {
        if self.filter_missing_only {
            self.videos.iter().filter(|v| v.has_missing_metadata()).collect()
        } else {
            self.videos.iter().collect()
        }
    }

    fn next_video(&mut self) {
        let videos = self.get_filtered_videos();
        if !videos.is_empty() && self.current_index < videos.len() - 1 {
            self.current_index += 1;
        }
    }

    fn previous_video(&mut self) {
        if self.current_index > 0 {
            self.current_index -= 1;
        }
    }

    fn toggle_filter(&mut self) {
        self.filter_missing_only = !self.filter_missing_only;
        self.current_index = 0;
    }

    fn next_video_with_missing_metadata(&mut self) {
        let video_count = if self.filter_missing_only {
            self.videos.iter().filter(|v| v.has_missing_metadata()).count()
        } else {
            self.videos.len()
        };
        
        if video_count == 0 {
            return;
        }
        
        let start_index = self.current_index;
        
        loop {
            self.current_index = (self.current_index + 1) % video_count;
            if self.current_index == start_index {
                break;
            }
            
            let videos = self.get_filtered_videos();
            if videos.get(self.current_index).map_or(false, |v| v.has_missing_metadata()) {
                break;
            }
        }
    }

    async fn edit_show(&mut self) -> Result<()> {
        let videos = self.get_filtered_videos();
        if videos.is_empty() || self.current_index >= videos.len() {
            return Ok(());
        }
        
        let video = videos[self.current_index];
        let video_id = &video.id;
        let video_title = &video.title;
        
        // Temporarily exit TUI mode
        disable_raw_mode()?;
        
        let mut editor = ShowEditor::new(self.db.clone()).await?;
        if let Some(show_id) = editor.select_show(video_id, video_title).await? {
            // Show was selected and assigned
            println!("\rShow assigned successfully!");
            
            // Update the video's episode data in memory
            if let Ok(Some((_, code))) = self.db.get_episode_by_video_id(video_id).await {
                // Get the show name from the editor's shows list
                if let Some((_, show_name)) = editor.shows.iter().find(|(id, _)| id == &show_id) {
                    let video_id_to_update = video.id.clone();
                    
                    // Find and update the video in the main list
                    if let Some(video_to_update) = self.videos.iter_mut().find(|v| v.id == video_id_to_update) {
                        video_to_update.episode = Some(crate::video::Episode {
                            show: crate::video::Show {
                                name: show_name.clone(),
                            },
                            code: Some(code),
                        });
                    }
                }
            }
        }
        
        // Re-enter TUI mode
        enable_raw_mode()?;
        Ok(())
    }

    async fn edit_guests(&mut self) -> Result<()> {
        let videos = self.get_filtered_videos();
        if videos.is_empty() || self.current_index >= videos.len() {
            return Ok(());
        }
        
        let video = videos[self.current_index];
        let video_id = &video.id;
        let video_title = &video.title;
        
        // Get existing person IDs from credits
        // Since we're not fetching credits from GraphQL, we'll start with an empty list
        // In a real implementation, we might want to query the database for existing assignments
        let existing_person_ids: Vec<String> = vec![];
        
        // Temporarily exit TUI mode
        disable_raw_mode()?;
        
        let mut editor = GuestEditor::new(self.db.clone(), existing_person_ids).await?;
        let selected_people = editor.edit_guests(video_id, video_title).await?;
        
        // Update the video's guest list with the selected people
        let videos = self.get_filtered_videos();
        if let Some(video) = videos.get(self.current_index) {
            let video_id_to_update = video.id.clone();
            
            // Find and update the video in the main list
            if let Some(video_to_update) = self.videos.iter_mut().find(|v| v.id == video_id_to_update) {
                // Clear existing credits
                video_to_update.credits_for_role.clear();
                
                // Add the selected people as credits
                for (person_id, forename, surname) in selected_people {
                    video_to_update.credits_for_role.push(crate::video::Credit {
                        person_id: Some(person_id),
                        person: Some(crate::video::Person {
                            forename,
                            surname,
                        })
                    });
                }
            }
        }
        
        // Re-enter TUI mode
        enable_raw_mode()?;
        Ok(())
    }

    async fn edit_technologies(&mut self) -> Result<()> {
        let videos = self.get_filtered_videos();
        if videos.is_empty() || self.current_index >= videos.len() {
            return Ok(());
        }
        
        let video = videos[self.current_index];
        let video_id = &video.id;
        let video_title = &video.title;
        
        // Get existing technology IDs
        let existing_tech_ids: Vec<String> = video.technologies
            .iter()
            .filter_map(|t| t.id.clone())
            .collect();
        
        // Temporarily exit TUI mode
        disable_raw_mode()?;
        
        let mut editor = TechnologyEditor::new(self.db.clone(), existing_tech_ids).await?;
        let selected_techs = editor.edit_technologies(video_id, video_title).await?;
        
        // Update the video's technology list with the selected technologies
        // We need to find the actual video in the unfiltered list
        let videos = self.get_filtered_videos();
        if let Some(video) = videos.get(self.current_index) {
            let video_id_to_update = video.id.clone();
            
            // Find and update the video in the main list
            if let Some(video_to_update) = self.videos.iter_mut().find(|v| v.id == video_id_to_update) {
                // Clear existing technologies
                video_to_update.technologies.clear();
                
                // Add the selected technologies with full information
                for (tech_id, tech_name) in selected_techs {
                    video_to_update.technologies.push(crate::video::Technology {
                        id: Some(tech_id),
                        name: tech_name,
                    });
                }
            }
        }
        
        // Re-enter TUI mode
        enable_raw_mode()?;
        Ok(())
    }
}