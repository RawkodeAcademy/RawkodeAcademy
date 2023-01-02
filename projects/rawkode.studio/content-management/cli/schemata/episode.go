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
}

type Chapter struct {
	time  int
	title string
}
