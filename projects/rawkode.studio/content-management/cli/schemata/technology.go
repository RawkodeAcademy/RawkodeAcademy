package schemata

import (
	"gorm.io/gorm"
)

type Technology struct {
	ID          string
	Name        string `gorm:"uniqueIndex"`
	Description string

	Website       string
	Documentation string

	openSource bool   `gorm:"default:true"`
	Repository string `gorm:"uniqueIndex"`

	TwitterHandle string `gorm:"uniqueIndex; check:valid_twitter_handle, OR (char_length(\"twitterHandle\") >= 4 AND char_length(\"twitterHandle\") <= 15)"`
	YouTubeHandle string `gorm:"uniqueIndex; check:valid_youtube_handle, OR (char_length(\"youtubeHandle\") >= 3 AND char_length(\"youtubeHandle\") <= 30)"`

	gorm.Model
}
