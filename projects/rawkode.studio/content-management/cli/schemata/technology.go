package schemata

import (
	"gorm.io/gorm"
)

type Technology struct {
	Name        string
	Description string

	Website       string
	Documentation string

	openSource bool
	Repository string

	gorm.Model
}
