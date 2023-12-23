package utils

import (
	"errors"

	"github.com/spf13/viper"
	"rawkode.academy/cli/pkg/supabase"
)

func GetSupabaseCredentials() (*supabase.SupabaseCredentials, error) {
	supabaseApiUrl := viper.GetString("supabase-api-url")

	if supabaseApiUrl == "" {
		return nil, errors.New("supabase api url is not set")
	}

	supabaseServiceRoleKey := viper.GetString("supabase-service-role-key")

	if supabaseServiceRoleKey == "" {
		return nil, errors.New("supabase service role key ist not set")
	}

	return &supabase.SupabaseCredentials{
		SupabaseApiUrl:         supabaseApiUrl,
		SupabaseServiceRoleKey: supabaseServiceRoleKey,
	}, nil
}
