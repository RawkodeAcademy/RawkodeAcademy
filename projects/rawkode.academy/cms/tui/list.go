package main

import (
	"fmt"
	"io"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type listModel struct {
	list       list.Model
	selectedID string
	loading    bool
}

type listItem struct {
	id          string
	title       string
	description string
}

func (i listItem) Title() string       { return i.title }
func (i listItem) Description() string  { return i.description }
func (i listItem) FilterValue() string { return i.title }

func newListModel() listModel {
	items := []list.Item{}
	
	delegate := newItemDelegate()
	l := list.New(items, delegate, 0, 0)
	l.Title = "Loading..."
	l.SetShowHelp(false)
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(true)
	l.Styles.Title = listTitleStyle
	l.Styles.PaginationStyle = paginationStyle
	l.Styles.HelpStyle = helpStyle

	return listModel{
		list: l,
	}
}

var (
	itemStyle         = lipgloss.NewStyle().PaddingLeft(4)
	selectedItemStyle = lipgloss.NewStyle().PaddingLeft(2).Foreground(lipgloss.Color("170"))
	listTitleStyle    = lipgloss.NewStyle().MarginLeft(2).Foreground(lipgloss.Color("229"))
	paginationStyle   = list.DefaultStyles().PaginationStyle.PaddingLeft(4)
	helpStyle         = list.DefaultStyles().HelpStyle.PaddingLeft(4).PaddingBottom(1)
)

type itemDelegate struct{}

func newItemDelegate() itemDelegate {
	return itemDelegate{}
}

func (d itemDelegate) Height() int                             { return 2 }
func (d itemDelegate) Spacing() int                            { return 1 }
func (d itemDelegate) Update(msg tea.Msg, m *list.Model) tea.Cmd { return nil }

func (d itemDelegate) Render(w io.Writer, m list.Model, index int, item list.Item) {
	i, ok := item.(listItem)
	if !ok {
		return
	}

	titleStyle := lipgloss.NewStyle().Bold(true)
	descStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("241"))

	if index == m.Index() {
		titleStyle = titleStyle.Foreground(lipgloss.Color("170"))
		descStyle = descStyle.Foreground(lipgloss.Color("245"))
		fmt.Fprint(w, selectedItemStyle.Render("> "+titleStyle.Render(i.title)+"\n  "+descStyle.Render(i.description)))
	} else {
		fmt.Fprint(w, itemStyle.Render(titleStyle.Render(i.title)+"\n"+descStyle.Render(i.description)))
	}
}

func (m listModel) Init() tea.Cmd {
	return m.LoadItems("videos")
}

func (m listModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			if item, ok := m.list.SelectedItem().(listItem); ok {
				m.selectedID = item.id
			}
		case "n":
			// Create new item
		case "esc":
			m.selectedID = ""
		}
	case loadingMsg:
		m.loading = true
		return m, nil
	case itemsLoadedMsg:
		m.loading = false
		m.list.Title = fmt.Sprintf("%d items", len(msg.items))
		cmd := m.list.SetItems(msg.items)
		return m, cmd
	}

	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m listModel) View() string {
	if m.loading {
		return "\n  Loading..."
	}
	return m.list.View()
}

func (m *listModel) SetSize(width, height int) {
	m.list.SetWidth(width)
	m.list.SetHeight(height)
}

type itemsLoadedMsg struct {
	items []list.Item
}

type loadingMsg struct{}

func (m listModel) LoadItems(contentType string) tea.Cmd {
	return tea.Batch(
		func() tea.Msg { return loadingMsg{} },
		func() tea.Msg {
			client := newGraphQLClient()
			
			switch contentType {
		case "videos":
			videos, err := client.getLatestVideos(20)
			if err != nil {
				// Fallback to database
				dbClient := newDatabaseClient()
				videos, err = dbClient.getAllVideosFromDB()
				if err != nil {
					return nil
				}
			}
			items := make([]list.Item, len(videos))
			for i, v := range videos {
				desc := v.Description
				if len(desc) > 80 {
					desc = desc[:77] + "..."
				}
				items[i] = listItem{
					id:          v.ID,
					title:       v.Title,
					description: desc,
				}
			}
			return itemsLoadedMsg{items: items}
			
		case "shows":
			shows, err := client.getAllShows()
			if err != nil {
				// Fallback to database
				dbClient := newDatabaseClient()
				shows, err = dbClient.getAllShowsFromDB()
				if err != nil {
					items := []list.Item{
						listItem{
							id:          "error",
							title:       "Error loading shows",
							description: fmt.Sprintf("Error: %v", err),
						},
					}
					return itemsLoadedMsg{items: items}
				}
			}
			items := make([]list.Item, len(shows))
			for i, s := range shows {
				items[i] = listItem{
					id:          s.ID,
					title:       s.Name,
					description: fmt.Sprintf("%d episodes", len(s.Episodes)),
				}
			}
			return itemsLoadedMsg{items: items}
			
		case "people":
			// Try GraphQL first (from video guests)
			people, err := client.getPeopleFromVideos()
			if err != nil || len(people) == 0 {
				// Fallback to database
				dbClient := newDatabaseClient()
				people, err = dbClient.getAllPeople()
				if err != nil {
					items := []list.Item{
						listItem{
							id:          "error",
							title:       "Error loading people",
							description: fmt.Sprintf("Database error: %v", err),
						},
					}
					return itemsLoadedMsg{items: items}
				}
			}
			items := make([]list.Item, len(people))
			for i, p := range people {
				bio := p.Biography
				if len(bio) > 80 {
					bio = bio[:77] + "..."
				}
				items[i] = listItem{
					id:          p.ID,
					title:       fmt.Sprintf("%s %s", p.Forename, p.Surname),
					description: bio,
				}
			}
			return itemsLoadedMsg{items: items}
			
		case "technologies":
			techs, err := client.getTechnologies()
			if err != nil {
				return nil
			}
			items := make([]list.Item, len(techs))
			for i, t := range techs {
				desc := t.Description
				if len(desc) > 80 {
					desc = desc[:77] + "..."
				}
				items[i] = listItem{
					id:          t.ID,
					title:       t.Name,
					description: desc,
				}
			}
			return itemsLoadedMsg{items: items}
			
		case "episodes":
			episodes, err := client.getAllEpisodes()
			if err != nil {
				return nil
			}
			items := make([]list.Item, len(episodes))
			for i, e := range episodes {
				items[i] = listItem{
					id:          e.ID,
					title:       e.Code,
					description: fmt.Sprintf("Episode %s", e.Code),
				}
			}
			return itemsLoadedMsg{items: items}
		}
		
		return itemsLoadedMsg{items: []list.Item{}}
		},
	)
}