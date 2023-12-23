package event

import (
	"fmt"
	"time"

	"github.com/charmbracelet/huh"
	"github.com/spf13/cobra"
	"rawkode.academy/cli/cmd/utils"
	"rawkode.academy/cli/pkg/form"
	"rawkode.academy/cli/pkg/supabase"
)

type ListEvents struct {
	TimeRange string `form-type:"select"`
}

type TimeRange struct {
	From time.Time
	To   time.Time
}

var EventListCommand = &cobra.Command{
	Use:   "list",
	Short: "list events",
	RunE: func(cmd *cobra.Command, args []string) error {
		supabaseCredentials, err := utils.GetSupabaseCredentials()

		if err != nil {
			return err
		}

		supabase, err := supabase.NewSupabase(supabaseCredentials)

		if err != nil {
			return err
		}

		options := make(map[string][]string)
		options["TimeRange"] = []string{"today", "tomorrow", "this week", "next week", "this month", "next month"}

		form := form.NewForm(ListEvents{}, make(map[string]func(string) error), options, huh.ThemeCharm())

		result, err := form.Run()

		if err != nil {
			return err
		}

		var timeRange = &TimeRange{}
		var now = time.Now()

		switch result.TimeRange {
		case "today":
			timeRange.From = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			timeRange.To = timeRange.From.Add(24 * time.Hour)
		case "tomorrow":
			timeRange.From = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Add(24 * time.Hour)
			timeRange.To = timeRange.From.Add(24 * time.Hour)
		case "this week":
			offset := int(time.Monday - now.Weekday())
			if offset > 0 {
				offset -= 7
			}

			timeRange.From = now.AddDate(0, 0, offset)
			timeRange.To = timeRange.From.AddDate(0, 0, 7)
		case "next week":
			offset := int(time.Monday-now.Weekday()) + 7
			if offset > 0 {
				offset -= 7
			}
			timeRange.From = now.AddDate(0, 0, offset)
			timeRange.To = timeRange.From.AddDate(0, 0, 7)
		case "this month":
			timeRange.From = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
			timeRange.To = time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, now.Location())
		case "next month":
			timeRange.From = time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
			timeRange.To = time.Date(now.Year(), now.Month()+2, 0, 23, 59, 59, 999999999, now.Location())
		}

		var filterHack = fmt.Sprintf("start_time.gte.%s,start_time.lt.%s", timeRange.From.Format("2006-01-02"), timeRange.To.Format("2006-01-02"))

		if events, _, err := supabase.From("events").Select("*", "exact", false).And(filterHack, "").ExecuteString(); err != nil {
			return err
		} else {
			fmt.Println(events)

			return nil
		}
	},
}
