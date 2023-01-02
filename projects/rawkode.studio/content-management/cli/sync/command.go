package sync

import (
	"fmt"

	"github.com/spf13/cobra"
)

var Command = &cobra.Command{
	Use:   "sync",
	Short: "Sync Local Data with Database",
	PreRun: func(cmd *cobra.Command, args []string) {
		fmt.Println("Ensuring a database environment variable exists")
	},
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Syncing")
	},
}
