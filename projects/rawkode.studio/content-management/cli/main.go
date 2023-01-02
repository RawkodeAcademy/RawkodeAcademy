package main

import (
	"github.com/RawkodeAcademy/RawkodeAcademy/projects/rawkode.studio/content-management/cli/lint"
	"github.com/RawkodeAcademy/RawkodeAcademy/projects/rawkode.studio/content-management/cli/migrate"
	"github.com/RawkodeAcademy/RawkodeAcademy/projects/rawkode.studio/content-management/cli/sync"
	"github.com/spf13/cobra"
)

func main() {
	var rootCmd = &cobra.Command{
		Use:   "rks",
		Short: "Rawkode Studio",
	}

	rootCmd.AddCommand(lint.Command)
	rootCmd.AddCommand(migrate.Command)
	rootCmd.AddCommand(sync.Command)
	rootCmd.Execute()
}
