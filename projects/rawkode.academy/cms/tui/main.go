package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type sessionState int

const (
	showListView sessionState = iota
	showDetailView
	showCreateView
	showEditView
	showTriageView
)

type model struct {
	state        sessionState
	contentType  string
	selectedItem string
	width        int
	height       int
	list         listModel
	detail       detailModel
	form         formModel
	triage       triageModel
}

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("229")).
			MarginBottom(1)

	selectedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("170")).
			Bold(true)
)

func initialModel() model {
	return model{
		state:       showListView,
		contentType: "videos",
		list:        newListModel(),
		detail:      newDetailModel(),
		form:        newFormModel(),
		triage:      newTriageModel(),
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.list.Init(),
		tea.EnterAltScreen,
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.list.SetSize(msg.Width, msg.Height-4)
		m.detail.SetSize(msg.Width, msg.Height-4)
		m.form.SetSize(msg.Width, msg.Height-4)
		m.triage.width = msg.Width
		m.triage.height = msg.Height

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "tab":
			if m.state != showTriageView {
				m.contentType = nextContentType(m.contentType)
				cmd := m.list.LoadItems(m.contentType)
				cmds = append(cmds, cmd)
			}
		case "t", "T":
			if m.state == showListView && m.contentType == "videos" {
				m.state = showTriageView
				cmd := m.triage.Init()
				cmds = append(cmds, cmd)
			}
		}
	}

	switch m.state {
	case showListView:
		newList, cmd := m.list.Update(msg)
		m.list = newList.(listModel)
		cmds = append(cmds, cmd)

		if m.list.selectedID != "" {
			m.selectedItem = m.list.selectedID
			m.state = showDetailView
			cmd := m.detail.LoadItem(m.contentType, m.selectedItem)
			cmds = append(cmds, cmd)
		}

	case showDetailView:
		newDetail, cmd := m.detail.Update(msg)
		m.detail = newDetail.(detailModel)
		cmds = append(cmds, cmd)

		if m.detail.goBack {
			m.state = showListView
			m.detail.goBack = false
		}

	case showTriageView:
		// Check if we should exit triage mode first
		if keyMsg, ok := msg.(tea.KeyMsg); ok && keyMsg.String() == "esc" {
			m.state = showListView
			return m, nil
		}
		
		newTriage, cmd := m.triage.Update(msg)
		m.triage = newTriage.(triageModel)
		cmds = append(cmds, cmd)
	}

	return m, tea.Batch(cmds...)
}

func (m model) View() string {
	if m.state == showTriageView {
		return m.triage.View()
	}

	header := titleStyle.Render(fmt.Sprintf("Rawkode Academy CMS - %s", m.contentType))
	tabs := renderTabs(m.contentType)

	var content string
	switch m.state {
	case showListView:
		content = m.list.View()
		if m.contentType == "videos" {
			content += "\n\nPress 'T' to enter triage mode"
		}
	case showDetailView:
		content = m.detail.View()
	case showCreateView, showEditView:
		content = m.form.View()
	}

	return lipgloss.JoinVertical(lipgloss.Left, header, tabs, content)
}

func renderTabs(selected string) string {
	tabs := []string{"videos", "episodes", "people", "shows", "technologies"}
	var rendered []string

	for _, tab := range tabs {
		if tab == selected {
			rendered = append(rendered, selectedStyle.Render(tab))
		} else {
			rendered = append(rendered, tab)
		}
	}

	return lipgloss.JoinHorizontal(lipgloss.Left, rendered...) + "\n"
}

func nextContentType(current string) string {
	types := []string{"videos", "episodes", "people", "shows", "technologies"}
	for i, t := range types {
		if t == current {
			return types[(i+1)%len(types)]
		}
	}
	return "videos"
}

func main() {
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v", err)
		os.Exit(1)
	}
}