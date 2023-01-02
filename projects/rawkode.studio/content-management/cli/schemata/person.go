package schemata

import (
	"gorm.io/gorm"
)

type Person struct {
	Id            string `gorm:"->;type:GENERATED ALWAYS AS (githubHandle) STORED; primaryKey;"`
	Name          string
	Biography     string
	Email         string `gorm:"uniqueIndex"; json:"-"`
	TwitterHandle string `gorm:"uniqueIndex; check:valid_twitter_handle, OR (char_length(\"twitterHandle\") >= 4 AND char_length(\"twitterHandle\") <= 15)"`
	YouTubeHandle string `gorm:"uniqueIndex; check:valid_youtube_handle, OR (char_length(\"youtubeHandle\") >= 3 AND char_length(\"youtubeHandle\") <= 30)"`
	GitHubHandle  string `gorm:"uniqueIndex"`
	Website       string `gorm:"uniqueIndex"`

	gorm.Model
}
