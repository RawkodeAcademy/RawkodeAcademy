package supabase

import (
	"github.com/supabase-community/supabase-go"
)

type SupabaseCredentials struct {
	SupabaseApiUrl         string
	SupabaseServiceRoleKey string
}

func NewSupabase(supabaseCredentials *SupabaseCredentials) (*supabase.Client, error) {
	return supabase.NewClient(supabaseCredentials.SupabaseApiUrl, supabaseCredentials.SupabaseServiceRoleKey, &supabase.ClientOptions{})
}
