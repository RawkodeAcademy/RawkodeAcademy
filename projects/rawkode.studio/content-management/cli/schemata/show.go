package schemata

type Show struct {
	ID   string
	Name string `gorm:"uniqueIndex"`
}
