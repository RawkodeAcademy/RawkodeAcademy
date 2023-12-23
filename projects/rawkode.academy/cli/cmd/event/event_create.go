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
	"rawkode.academy/cli/pkg/form"
	"rawkode.academy/cli/pkg/supabase"
)

type InsertEvent struct {
	Slug        string `json:"slug"`
	Name        string `json:"name" form-type:"input" form-description:"used to calculate slug e.g. 'hello world' results in 'hello-world'"`
	Description string `json:"description,omitempty" form-type:"text" form-limit:"4096"`
	CoverUrl    string `json:"cover_url,omitempty" form-type:"input"`
	StartTime   string `json:"start_time" form-type:"input" form-description:"ISO 8601 date-time"`
	Duration    string `json:"duration,omitempty" form-type:"input" form-description:"ISO 8601 duration"`
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

		validators := make(map[string]func(string) error)
		validators["Name"] = func(s string) error {
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
		}
		validators["StartTime"] = func(s string) error {
			if s == "" {
				return errors.New("start time must not be empty")
			}

			if _, err := iso8601.ParseString(s); err != nil {
				return fmt.Errorf("time '%s' is not a valid ISO 8601 date-time: %s", s, err.Error())
			}

			return nil
		}
		validators["Duration"] = func(s string) error {
			if s == "" {
				return nil
			}

			if _, err := iso8601Duration.Parse(s); err != nil {
				return fmt.Errorf("duration '%s' is not a valid ISO 8601 duration: %s", s, err.Error())
			}

			return nil

		}

		form := form.NewForm(InsertEvent{}, validators, huh.ThemeCharm())

		result, err := form.Run()

		if err != nil {
			return err
		}

		result.Slug = slug.Make(result.Name)

		if _, _, err := supabase.From("events").Insert(result, false, "", "minimal", "exact").ExecuteString(); err != nil {
			return err
		}

		return nil
	},
}
