package schemata

import (
	"gorm.io/gorm"
)

type Show struct {
	ID   string
	Name string `gorm:"uniqueIndex"`

	gorm.Model
}
