package cmd

import (
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"rawkode.academy/cli/cmd/event"
)

var (
	rootCmd = &cobra.Command{
		Use:   "rka",
		Short: "rka - rawkode academy cli",
		Long:  `Rawkode Academy CLI`,
	}
)

func init() {
	rootCmd.PersistentFlags().String("supabase-api-url", "", "Supabase API URL")
	rootCmd.PersistentFlags().String("supabase-service-role-key", "", "Supabase service role key")

	viper.BindPFlags(rootCmd.PersistentFlags())
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))

	rootCmd.AddCommand(completionCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(event.EventCommand)
}

func Execute() error {
	return rootCmd.Execute()
}
