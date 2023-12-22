package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of rka",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("2023.12.21")
	},
}
