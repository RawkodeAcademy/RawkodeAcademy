package event

import "github.com/spf13/cobra"

func init() {
	EventCommand.AddCommand(EventCreateCommand)
}

var EventCommand = &cobra.Command{
	Use:   "event",
	Short: "event sub commands",
}
