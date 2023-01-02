package migrate

import (
	"fmt"
	"github.com/RawkodeAcademy/RawkodeAcademy/projects/rawkode.studio/content-management/cli/schemata"
	"github.com/spf13/cobra"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
)

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
