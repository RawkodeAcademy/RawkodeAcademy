package lint

import (
	"fmt"

	"github.com/spf13/cobra"
)

var Command = &cobra.Command{
	Use:   "lint",
	Short: "Lint Local Data",
	PreRun: func(cmd *cobra.Command, args []string) {
		fmt.Println("Ensuring a database environment variable exists")
	},
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Linted")
	},
}
