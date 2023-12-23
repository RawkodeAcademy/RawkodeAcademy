package event

import (
	"fmt"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"
)

type InsertEvent struct {
	Slug        string `json:"slug"`
	Name        string `json:"name" form-type:"input" form-description:"used to calculate slug e.g. 'hello world' results in 'hello-world'"`
	Description string `json:"description,omitempty" form-type:"text" form-limit:"4096"`
	CoverUrl    string `json:"cover_url,omitempty" form-type:"input"`
	StartTime   string `json:"start_time" form-type:"input" form-description:"ISO 8601 date-time"`
	Duration    string `json:"duration,omitempty" form-type:"input" form-description:"ISO 8601 duration"`
}

type model struct {
	nameInput textinput.Model
	err       error
}

type (
	errMsg error
)

func initModel() model {
	nameInput := textinput.New()
	nameInput.Placeholder = "Name..."
	nameInput.Focus()
	nameInput.Width = 20

	return model{
		nameInput: nameInput,
		err:       nil,
	}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEnter, tea.KeyCtrlC, tea.KeyEsc:
			return m, tea.Quit
		}

	case errMsg:
		m.err = msg
		return m, nil
	}

	m.nameInput, cmd = m.nameInput.Update(msg)

	return m, cmd
}

func (m model) View() string {
	return fmt.Sprintf(
		"lel\n%s\n\n%s",
		m.nameInput.View(),
		"(esc to quit)",
	) + "\n"
}

var EventCreateCommand = &cobra.Command{
	Use:   "create",
	Short: "create event",
	RunE: func(cmd *cobra.Command, args []string) error {
		p := tea.NewProgram(initModel())

		if _, err := p.Run(); err != nil {
			return err
		}

		return nil
	},
}

//var EventCreateCommand = &cobra.Command{
//	Use:   "create",
//	Short: "create event",
//	RunE: func(cmd *cobra.Command, args []string) error {
//		supabaseCredentials, err := utils.GetSupabaseCredentials()
//
//		if err != nil {
//			return err
//		}
//
//		supabase, err := supabase.NewSupabase(supabaseCredentials)
//
//		if err != nil {
//			return err
//		}
//
//		validators := make(map[string]func(string) error)
//		validators["Name"] = func(s string) error {
//			slug := slug.Make(s)
//
//			if slug == "" {
//				return errors.New("name must not be empty")
//			}
//
//			if _, count, err := supabase.From("events").Select("slug", "exact", true).Eq("slug", slug).ExecuteString(); err != nil {
//				return err
//			} else if count >= 1 {
//				return fmt.Errorf("slug '%s' already taken", slug)
//			}
//
//			return nil
//		}
//		validators["StartTime"] = func(s string) error {
//			if s == "" {
//				return errors.New("start time must not be empty")
//			}
//
//			if _, err := iso8601.ParseString(s); err != nil {
//				return fmt.Errorf("time '%s' is not a valid ISO 8601 date-time: %s", s, err.Error())
//			}
//
//			return nil
//		}
//		validators["Duration"] = func(s string) error {
//			if s == "" {
//				return nil
//			}
//
//			if _, err := iso8601Duration.Parse(s); err != nil {
//				return fmt.Errorf("duration '%s' is not a valid ISO 8601 duration: %s", s, err.Error())
//			}
//
//			return nil
//
//		}
//
//		form := form.NewForm(InsertEvent{}, validators, map[string][]string{}, huh.ThemeCharm())
//
//		result, err := form.Run()
//
//		if err != nil {
//			return err
//		}
//
//		result.Slug = slug.Make(result.Name)
//
//		if _, _, err := supabase.From("events").Insert(result, false, "", "minimal", "exact").ExecuteString(); err != nil {
//			return err
//		}
//
//		fmt.Printf("🚀 successfully created event '%s', starting at '%s'\n", result.Slug, result.StartTime)
//
//		return nil
//	},
//}
