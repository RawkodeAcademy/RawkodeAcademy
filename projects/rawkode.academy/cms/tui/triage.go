package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type triageField int

const (
	showField triageField = iota
	episodeField
	guestsField
	technologiesField
)

type triageModel struct {
	videos          []Video
	currentVideoIdx int
	currentField    triageField
	inputs          [4]textinput.Model
	suggestions     map[triageField][]string
	selectedItems   map[triageField][]string
	allShows        []Show
	allPeople       []Person
	allTechnologies []Technology
	width           int
	height          int
	saving          bool
	error           string
	loadError       error
}

func newTriageModel() triageModel {
	var inputs [4]textinput.Model
	suggestions := make(map[triageField][]string)
	selectedItems := make(map[triageField][]string)

	// Initialize text inputs for each field
	fields := []triageField{showField, episodeField, guestsField, technologiesField}
	placeholders := []string{"Type show name...", "Type episode code...", "Type guest name...", "Type technology name..."}
	
	for i, field := range fields {
		inputs[i] = textinput.New()
		inputs[i].Placeholder = placeholders[i]
		inputs[i].CharLimit = 100
		inputs[i].Width = 80  // Increased width
		inputs[i].Prompt = ""  // No prompt, we'll show it in the label
		if i == 0 {
			inputs[i].Focus()
			inputs[i].PromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
			inputs[i].TextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("255"))
		}
		suggestions[field] = []string{}
		selectedItems[field] = []string{}
	}

	return triageModel{
		inputs:        inputs,
		suggestions:   suggestions,
		selectedItems: selectedItems,
		currentField:  showField,
	}
}

func (m triageModel) Init() tea.Cmd {
	return tea.Batch(
		m.loadVideos(),
		m.loadReferenceData(),
		textinput.Blink,
	)
}

func (m triageModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case videosLoadedMsg:
		m.videos = msg.videos
		m.loadError = msg.err
		if len(m.videos) > 0 {
			return m, m.loadCurrentVideoData()
		}
		return m, nil

	case referenceDataLoadedMsg:
		m.allShows = msg.shows
		m.allPeople = msg.people
		m.allTechnologies = msg.technologies
		return m, nil

	case currentVideoDataMsg:
		// Pre-fill fields with current data
		if msg.show != "" {
			m.inputs[showField].SetValue(msg.show)
			m.selectedItems[showField] = []string{msg.show}
		}
		if msg.episode != "" {
			m.inputs[episodeField].SetValue(msg.episode)
		}
		m.selectedItems[guestsField] = msg.guests
		m.selectedItems[technologiesField] = msg.technologies
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "esc":
			// Handled in main.go to return to list view
			return m, nil
		
		case "tab":
			// Move to next field
			m.currentField = (m.currentField + 1) % 4
			for i := range m.inputs {
				if triageField(i) == m.currentField {
					m.inputs[i].Focus()
					m.inputs[i].PromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
					m.inputs[i].TextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("255"))
				} else {
					m.inputs[i].Blur()
					m.inputs[i].PromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
					m.inputs[i].TextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
				}
			}
			return m, nil
		
		case "shift+tab":
			// Move to previous field
			m.currentField = (m.currentField + 3) % 4
			for i := range m.inputs {
				if triageField(i) == m.currentField {
					m.inputs[i].Focus()
					m.inputs[i].PromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
					m.inputs[i].TextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("255"))
				} else {
					m.inputs[i].Blur()
					m.inputs[i].PromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
					m.inputs[i].TextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
				}
			}
			return m, nil
		
		case "enter":
			// Handle enter based on current field
			if m.currentField == guestsField || m.currentField == technologiesField {
				// Add item to selected list
				value := m.inputs[m.currentField].Value()
				if value != "" {
					m.selectedItems[m.currentField] = append(m.selectedItems[m.currentField], value)
					m.inputs[m.currentField].SetValue("")
				}
			}
			return m, nil
		
		case "ctrl+s":
			// Save and move to next video
			cmds = append(cmds, m.saveCurrentVideo())
		
		case "ctrl+n":
			// Skip to next video without saving
			m.nextVideo()
			cmds = append(cmds, m.loadCurrentVideoData())
		
		case "ctrl+p":
			// Go to previous video
			m.previousVideo()
			cmds = append(cmds, m.loadCurrentVideoData())
		default:
			// Update the current input for other keys
			var cmd tea.Cmd
			m.inputs[m.currentField], cmd = m.inputs[m.currentField].Update(msg)
			if cmd != nil {
				cmds = append(cmds, cmd)
			}
		}

		// Update autocomplete suggestions
		m.updateSuggestions()
		
	default:
		// Update the current input for non-key messages
		var cmd tea.Cmd
		m.inputs[m.currentField], cmd = m.inputs[m.currentField].Update(msg)
		if cmd != nil {
			cmds = append(cmds, cmd)
		}
	}

	return m, tea.Batch(cmds...)
}

func (m triageModel) View() string {
	if len(m.videos) == 0 {
		status := "\n  Loading videos for triage...\n"
		status += fmt.Sprintf("  Videos loaded: %d\n", len(m.videos))
		status += fmt.Sprintf("  Shows loaded: %d\n", len(m.allShows))
		status += fmt.Sprintf("  People loaded: %d\n", len(m.allPeople))
		status += fmt.Sprintf("  Technologies loaded: %d\n", len(m.allTechnologies))
		if m.loadError != nil {
			status += fmt.Sprintf("\n  Error: %v\n", m.loadError)
		}
		return status
	}

	var s strings.Builder
	
	// Header
	headerStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("229"))
	s.WriteString(headerStyle.Render(fmt.Sprintf("Video Triage Mode - %d/%d", m.currentVideoIdx+1, len(m.videos))) + "\n\n")
	
	// Current video info
	video := m.videos[m.currentVideoIdx]
	videoStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	s.WriteString(videoStyle.Render(fmt.Sprintf("Title: %s\n", video.Title)))
	if video.Description != "" {
		desc := video.Description
		if len(desc) > 100 {
			desc = desc[:97] + "..."
		}
		s.WriteString(videoStyle.Render(fmt.Sprintf("Description: %s\n", desc)))
	}
	s.WriteString("\n")

	// Fields
	fieldNames := []string{"Show", "Episode", "Guests", "Technologies"}
	fields := []triageField{showField, episodeField, guestsField, technologiesField}
	
	for i, field := range fields {
		// Field label
		label := fieldNames[i] + ":"
		if field == m.currentField {
			label = "> " + label
		} else {
			label = "  " + label
		}
		
		labelStyle := lipgloss.NewStyle().Bold(field == m.currentField)
		s.WriteString(labelStyle.Render(label) + "\n")
		
		// Input field - properly indented
		s.WriteString("    " + m.inputs[i].View() + "\n")
		
		// Show selected items for multi-select fields
		if field == guestsField || field == technologiesField {
			if len(m.selectedItems[field]) > 0 {
				selectedStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("170"))
				s.WriteString("  " + selectedStyle.Render("Selected: "+strings.Join(m.selectedItems[field], ", ")) + "\n")
			}
		}
		
		// Show suggestions
		if len(m.suggestions[field]) > 0 && m.currentField == field {
			suggestionStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("245"))
			s.WriteString("  " + suggestionStyle.Render("Suggestions: "+strings.Join(m.suggestions[field][:min(3, len(m.suggestions[field]))], ", ")) + "\n")
		}
		
		s.WriteString("\n")
	}

	// Help
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	s.WriteString(helpStyle.Render("\nTab/Shift+Tab: Navigate | Enter: Add item | Ctrl+S: Save & Next | Ctrl+N: Skip | Ctrl+P: Previous | Esc: Exit"))

	if m.error != "" {
		errorStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("196"))
		s.WriteString("\n\n" + errorStyle.Render("Error: "+m.error))
	}

	return s.String()
}

func (m *triageModel) updateSuggestions() {
	// Update suggestions based on current input
	for i, input := range m.inputs {
		field := triageField(i)
		value := strings.ToLower(input.Value())
		if value == "" {
			m.suggestions[field] = []string{}
			continue
		}

		switch field {
		case showField:
			var suggestions []string
			for _, show := range m.allShows {
				if strings.Contains(strings.ToLower(show.Name), value) {
					suggestions = append(suggestions, show.Name)
				}
			}
			m.suggestions[field] = suggestions

		case guestsField:
			var suggestions []string
			for _, person := range m.allPeople {
				fullName := person.Forename + " " + person.Surname
				if strings.Contains(strings.ToLower(fullName), value) {
					suggestions = append(suggestions, fullName)
				}
			}
			m.suggestions[field] = suggestions

		case technologiesField:
			var suggestions []string
			for _, tech := range m.allTechnologies {
				if strings.Contains(strings.ToLower(tech.Name), value) {
					suggestions = append(suggestions, tech.Name)
				}
			}
			m.suggestions[field] = suggestions
		}
	}
}

func (m *triageModel) nextVideo() {
	if m.currentVideoIdx < len(m.videos)-1 {
		m.currentVideoIdx++
		m.resetFields()
	}
}

func (m *triageModel) previousVideo() {
	if m.currentVideoIdx > 0 {
		m.currentVideoIdx--
		m.resetFields()
	}
}

func (m *triageModel) resetFields() {
	for i := range m.inputs {
		m.inputs[i].SetValue("")
	}
	for field := range m.selectedItems {
		m.selectedItems[field] = []string{}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Messages
type videosLoadedMsg struct {
	videos []Video
	err    error
}

type referenceDataLoadedMsg struct {
	shows        []Show
	people       []Person
	technologies []Technology
}

type currentVideoDataMsg struct {
	show         string
	episode      string
	guests       []string
	technologies []string
}

// Commands
func (m triageModel) loadVideos() tea.Cmd {
	return func() tea.Msg {
		dbClient := newDatabaseClient()
		videos, err := dbClient.getAllVideosFromDB()
		if err != nil {
			// Return empty videos with error
			return videosLoadedMsg{videos: []Video{}, err: err}
		}
		// Limit videos for testing
		if len(videos) > 10 {
			videos = videos[:10]
		}
		return videosLoadedMsg{videos: videos, err: nil}
	}
}

func (m triageModel) loadReferenceData() tea.Cmd {
	return func() tea.Msg {
		dbClient := newDatabaseClient()
		
		shows, _ := dbClient.getAllShowsFromDB()
		people, _ := dbClient.getAllPeople()
		technologies, _ := dbClient.getAllTechnologiesFromDB()
		
		return referenceDataLoadedMsg{
			shows:        shows,
			people:       people,
			technologies: technologies,
		}
	}
}

func (m triageModel) loadCurrentVideoData() tea.Cmd {
	return func() tea.Msg {
		if m.currentVideoIdx >= len(m.videos) || len(m.videos) == 0 {
			return currentVideoDataMsg{}
		}
		
		video := m.videos[m.currentVideoIdx]
		dbClient := newDatabaseClient()
		
		// Load full video data with associations
		fullVideo, err := dbClient.getVideoWithAssociations(video.ID)
		if err != nil {
			return currentVideoDataMsg{}
		}
		
		var showName string
		var episodeCode string
		var guestNames []string
		var techNames []string
		
		if fullVideo.Episode != nil {
			episodeCode = fullVideo.Episode.Code
			// Get show from episode
			episodeDB, err := dbClient.getConnection("episodes")
			if err == nil {
				defer episodeDB.Close()
				var showID string
				err = episodeDB.QueryRow("SELECT show_id FROM episodes WHERE id = ?", fullVideo.Episode.ID).Scan(&showID)
				if err == nil {
					show, err := dbClient.getShowWithHosts(showID)
					if err == nil {
						showName = show.Name
					}
				}
			}
		}
		
		// Get guest names
		guestIDs, _ := dbClient.getVideoGuests(video.ID)
		for _, guestID := range guestIDs {
			if person, err := dbClient.getPersonByID(guestID); err == nil {
				guestNames = append(guestNames, person.Forename+" "+person.Surname)
			}
		}
		
		// Get technology names
		for _, tech := range fullVideo.Technologies {
			techNames = append(techNames, tech.Name)
		}
		
		return currentVideoDataMsg{
			show:         showName,
			episode:      episodeCode,
			guests:       guestNames,
			technologies: techNames,
		}
	}
}

func (m triageModel) saveCurrentVideo() tea.Cmd {
	return func() tea.Msg {
		// TODO: Implement saving logic
		// This would involve:
		// 1. Creating/finding show
		// 2. Creating/updating episode
		// 3. Updating video-guests associations
		// 4. Updating video-technologies associations
		
		// For now, just move to next video
		m.nextVideo()
		return m.loadCurrentVideoData()()
	}
}