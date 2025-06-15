package main

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type detailModel struct {
	content     string
	width       int
	height      int
	goBack      bool
	scrollY     int
	contentType string
	itemID      string
}

func newDetailModel() detailModel {
	return detailModel{}
}

func (m detailModel) Init() tea.Cmd {
	return nil
}

func (m detailModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc", "b":
			m.goBack = true
		case "e":
			// Edit mode
		case "d":
			// Delete
		case "j", "down":
			if m.scrollY < strings.Count(m.content, "\n")-m.height+4 {
				m.scrollY++
			}
		case "k", "up":
			if m.scrollY > 0 {
				m.scrollY--
			}
		}
	case detailLoadedMsg:
		m.content = msg.content
		m.scrollY = 0
	}
	return m, nil
}

func (m detailModel) View() string {
	if m.content == "" {
		return "Loading..."
	}

	style := lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Padding(1, 2)

	lines := strings.Split(m.content, "\n")
	visibleLines := lines
	if len(lines) > m.height-2 {
		end := m.scrollY + m.height - 2
		if end > len(lines) {
			end = len(lines)
		}
		visibleLines = lines[m.scrollY:end]
	}

	content := strings.Join(visibleLines, "\n")
	footer := lipgloss.NewStyle().
		Foreground(lipgloss.Color("241")).
		Render("\n\nPress 'e' to edit, 'd' to delete, 'esc' to go back")

	return style.Render(content + footer)
}

func (m *detailModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

type detailLoadedMsg struct {
	content string
}

func (m *detailModel) LoadItem(contentType, id string) tea.Cmd {
	m.contentType = contentType
	m.itemID = id
	
	return func() tea.Msg {
		client := newGraphQLClient()
		var content string
		
		switch contentType {
		case "videos":
			video, err := client.getVideoByID(id)
			if err != nil {
				// Fallback to database with full associations
				dbClient := newDatabaseClient()
				video, err = dbClient.getVideoWithAssociations(id)
				if err != nil {
					content = fmt.Sprintf("Error loading video: %v", err)
				} else {
					content = formatVideo(video)
				}
			} else {
				content = formatVideo(video)
			}
			
		case "shows":
			show, err := client.getShowByID(id)
			if err != nil {
				// Fallback to database with hosts
				dbClient := newDatabaseClient()
				show, err = dbClient.getShowWithHosts(id)
				if err != nil {
					content = fmt.Sprintf("Error loading show: %v", err)
				} else {
					content = formatShow(show)
				}
			} else {
				content = formatShow(show)
			}
			
		case "technologies":
			dbClient := newDatabaseClient()
			tech, err := dbClient.getTechnologyByID(id)
			if err != nil {
				content = fmt.Sprintf("Error loading technology: %v", err)
			} else {
				content = formatTechnology(tech)
			}
			
		case "people":
			dbClient := newDatabaseClient()
			person, err := dbClient.getPersonByID(id)
			if err != nil {
				content = fmt.Sprintf("Error loading person: %v", err)
			} else {
				content = formatPerson(person)
			}
			
		case "episodes":
			content = "Episode details not yet implemented"
		}
		
		return detailLoadedMsg{content: content}
	}
}

func formatVideo(v *Video) string {
	var sb strings.Builder
	
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("241"))
	
	sb.WriteString(titleStyle.Render(v.Title) + "\n")
	if v.Subtitle != "" {
		sb.WriteString(v.Subtitle + "\n")
	}
	sb.WriteString("\n")
	
	sb.WriteString(labelStyle.Render("ID: ") + v.ID + "\n")
	sb.WriteString(labelStyle.Render("Published: ") + v.PublishedAt + "\n")
	sb.WriteString(labelStyle.Render("Duration: ") + fmt.Sprintf("%d seconds", v.Duration) + "\n")
	sb.WriteString(labelStyle.Render("Likes: ") + fmt.Sprintf("%d", v.Likes) + "\n")
	
	if v.Episode != nil {
		sb.WriteString(labelStyle.Render("Episode: ") + v.Episode.Code + "\n")
	}
	
	sb.WriteString("\n" + labelStyle.Render("Description:") + "\n")
	sb.WriteString(v.Description + "\n")
	
	if len(v.Technologies) > 0 {
		sb.WriteString("\n" + labelStyle.Render("Technologies:") + "\n")
		for _, t := range v.Technologies {
			sb.WriteString("  • " + t.Name + "\n")
		}
	}
	
	if len(v.Chapters) > 0 {
		sb.WriteString("\n" + labelStyle.Render("Chapters:") + "\n")
		for _, c := range v.Chapters {
			sb.WriteString(fmt.Sprintf("  %02d:%02d - %s\n", c.StartTime/60, c.StartTime%60, c.Title))
		}
	}
	
	if len(v.Guests) > 0 {
		sb.WriteString("\n" + labelStyle.Render("Guests:") + "\n")
		for _, g := range v.Guests {
			sb.WriteString(fmt.Sprintf("  • %s %s\n", g.Forename, g.Surname))
		}
	}
	
	return sb.String()
}

func formatShow(s *Show) string {
	var sb strings.Builder
	
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("241"))
	
	sb.WriteString(titleStyle.Render(s.Name) + "\n\n")
	sb.WriteString(labelStyle.Render("ID: ") + s.ID + "\n")
	
	if len(s.Hosts) > 0 {
		sb.WriteString("\n" + labelStyle.Render("Hosts:") + "\n")
		for _, h := range s.Hosts {
			sb.WriteString(fmt.Sprintf("  • %s %s\n", h.Forename, h.Surname))
		}
	}
	
	if len(s.Episodes) > 0 {
		sb.WriteString("\n" + labelStyle.Render("Episodes:") + " " + fmt.Sprintf("%d", len(s.Episodes)) + "\n")
	}
	
	return sb.String()
}

func formatTechnology(t *Technology) string {
	var sb strings.Builder
	
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("241"))
	
	sb.WriteString(titleStyle.Render(t.Name) + "\n\n")
	sb.WriteString(labelStyle.Render("ID: ") + t.ID + "\n")
	
	if t.Website != "" {
		sb.WriteString(labelStyle.Render("Website: ") + t.Website + "\n")
	}
	
	if t.Documentation != "" {
		sb.WriteString(labelStyle.Render("Documentation: ") + t.Documentation + "\n")
	}
	
	if t.Description != "" {
		sb.WriteString("\n" + labelStyle.Render("Description:") + "\n")
		sb.WriteString(t.Description + "\n")
	}
	
	return sb.String()
}

func formatPerson(p *Person) string {
	var sb strings.Builder
	
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("241"))
	
	sb.WriteString(titleStyle.Render(fmt.Sprintf("%s %s", p.Forename, p.Surname)) + "\n\n")
	sb.WriteString(labelStyle.Render("ID: ") + p.ID + "\n")
	
	if p.Biography != "" {
		sb.WriteString("\n" + labelStyle.Render("Biography:") + "\n")
		sb.WriteString(p.Biography + "\n")
	}
	
	return sb.String()
}