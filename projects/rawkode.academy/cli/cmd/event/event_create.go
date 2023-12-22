package event

import (
	"errors"
	"fmt"

	"github.com/charmbracelet/huh"
	"github.com/gosimple/slug"
	"github.com/relvacode/iso8601"
	iso8601Duration "github.com/sosodev/duration"
	"github.com/spf13/cobra"
	"rawkode.academy/cli/cmd/utils"
	"rawkode.academy/cli/pkg/supabase"
)

type InsertEvent struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	CoverUrl    string `json:"cover_url,omitempty"`
	StartTime   string `json:"start_time"`
	Duration    string `json:"duration,omitempty"`
}

var EventCreateCommand = &cobra.Command{
	Use:   "create",
	Short: "create event",
	RunE: func(cmd *cobra.Command, args []string) error {
		supabaseCredentials, err := utils.GetSupabaseCredentials(cmd.Root().Flags())

		if err != nil {
			return err
		}

		supabase, err := supabase.NewSupabase(supabaseCredentials)

		if err != nil {
			return err
		}

		var (
			name        string
			description string
			coverUrl    string
			startTime   string
			duration    string
		)

		form := huh.NewForm(
			huh.NewGroup(
				huh.NewInput().Title("name").Description("required - used to calculate slug e.g. 'hello world' results in 'hello-world'").Value(&name).Validate(func(s string) error {
					slug := slug.Make(s)

					if slug == "" {
						return errors.New("name must not be empty")
					}

					if _, count, err := supabase.From("events").Select("slug", "exact", true).Eq("slug", slug).ExecuteString(); err != nil {
						return err
					} else if count >= 1 {
						return fmt.Errorf("slug '%s' already taken", slug)
					}

					return nil
				}),
				huh.NewText().Description("optional - character limit: 4096").CharLimit(4096).Title("description").Value(&description),
				huh.NewInput().Description("optional").Title("cover url").Value(&coverUrl),
				huh.NewInput().Description("required - ISO 8601 date-time").Title("start time").Value(&startTime).Validate(func(s string) error {
					if s == "" {
						return errors.New("start time must not be empty")
					}

					if _, err := iso8601.ParseString(s); err != nil {
						return fmt.Errorf("time '%s' is not a valid ISO 8601 date-time: %s", s, err.Error())
					}

					return nil
				}),
				huh.NewInput().Description("optional - ISO 8601 duration").Title("duration").Value(&duration).Validate(func(s string) error {
					if s == "" {
						return nil
					}

					if _, err := iso8601Duration.Parse(s); err != nil {
						return fmt.Errorf("duration '%s' is not a valid ISO 8601 duration: %s", s, err.Error())
					}

					return nil
				}),
			),
		).WithTheme(huh.ThemeBase16())

		if err := form.Run(); err != nil {
			return err
		}

		eventSlug := slug.Make(name)

		insertEvent := &InsertEvent{
			Slug:        eventSlug,
			Name:        name,
			Description: description,
			CoverUrl:    coverUrl,
			StartTime:   startTime,
			Duration:    duration,
		}

		if _, _, err := supabase.From("events").Insert(insertEvent, false, "", "minimal", "exact").ExecuteString(); err != nil {
			return err
		}

		return nil
	},
}
