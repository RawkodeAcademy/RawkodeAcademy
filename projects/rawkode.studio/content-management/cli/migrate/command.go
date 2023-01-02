package migrate

import (
	"fmt"
	"os"

	"github.com/RawkodeAcademy/RawkodeAcademy/projects/rawkode.studio/content-management/cli/schemata"
	"github.com/spf13/cobra"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Still need these views for Hasura relationship flattening
//
// CREATE VIEW show_hosts_view AS
// SELECT "showId",
//     people.*
// FROM show_hosts
//     LEFT JOIN people ON show_hosts."personId" = people.id;

// CREATE VIEW host_shows_view AS
// SELECT "personId",
//     shows.*
// FROM show_hosts
//     LEFT JOIN shows ON show_hosts."showId" = shows.id;
// CREATE VIEW episode_guests_view AS
// SELECT "episodeId",
//     people.*
// FROM episode_guests
//     LEFT JOIN people ON episode_guests."personId" = people.id;

// CREATE VIEW guest_episodes_view AS
// SELECT "personId",
//     episodes.*
// FROM episode_guests
//     LEFT JOIN episodes ON episode_guests."episodeId" = episodes.id;

var Command = &cobra.Command{
	Use:   "migrate",
	Short: "Migrate Database",
	PreRun: func(cmd *cobra.Command, args []string) {
		fmt.Println("Ensuring a database environment variable exists")
	},
	Run: func(cmd *cobra.Command, args []string) {
		dsn := os.Getenv("DATABASE_URL")
		db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})

		db.AutoMigrate(&schemata.Person{}, &schemata.Show{}, &schemata.Technology{}, &schemata.Episode{})

		fmt.Println("Migrate")
	},
}
