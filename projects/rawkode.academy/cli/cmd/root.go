package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
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
	v := viper.New()

	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))

	rootCmd.Flags().String("supabase-api-url", "", "Supabase API URL")
	rootCmd.Flags().String("supabase-service-role-key", "", "Supabase service role key")

	rootCmd.Flags().VisitAll(func(f *pflag.Flag) {
		configName := f.Name

		if !f.Changed && v.IsSet(configName) {
			val := v.Get(configName)

			rootCmd.Flags().Set(configName, fmt.Sprintf("%v", val))
		}
	})

	rootCmd.AddCommand(completionCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(event.EventCommand)
}

func Execute() error {
	return rootCmd.Execute()
}
