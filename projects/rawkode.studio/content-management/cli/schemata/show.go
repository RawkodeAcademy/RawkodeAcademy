package schemata

type Show struct {
	ID    string
	Name  string   `gorm:"uniqueIndex"`
	Hosts []Person `gorm:"many2many:show_hosts;"`
}
