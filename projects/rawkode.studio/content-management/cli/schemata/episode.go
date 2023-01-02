package schemata

import (
	"time"
)

type Episode struct {
	ID    string
	Title string

	live       bool
	startedAt  *time.Time
	finishedAt *time.Time

	youtubeID       string `json:"-"`
	youtubeCategory int

	links []string

	chapters []Chapter

	Guests []Person `gorm:"many2many:episode_guests;"`
}

type Chapter struct {
	time  int
	title string
}
