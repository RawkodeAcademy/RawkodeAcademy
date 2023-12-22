package utils

import (
	"github.com/spf13/pflag"
	"rawkode.academy/cli/pkg/supabase"
)

func GetSupabaseCredentials(flagset *pflag.FlagSet) (*supabase.SupabaseCredentials, error) {
	supabaseApiUrl, err := flagset.GetString("supabase-api-url")

	if err != nil {
		return nil, err
	}

	supabaseServiceRoleKey, err := flagset.GetString("supabase-service-role-key")

	if err != nil {
		return nil, err
	}

	return &supabase.SupabaseCredentials{
		SupabaseApiUrl:         supabaseApiUrl,
		SupabaseServiceRoleKey: supabaseServiceRoleKey,
	}, nil
}
