import "time"

_schema: {
	name:      "LiveStream"
	namespace: "schema.rawkode.academy"
}

#LiveStream: {
	_dataset: {
		plural: "livestreams"
		supportedExtensions: ["yaml", "yml", "md", "mdx"]
	}

	title:    string
	show:     string @relationship(Show)
	datetime: time.Time()

	guests?: [...string] @relationship(Person)
	technologies?: [...string] @relationship(Technology)

	tags: [...string]

	chapters?: [...#Chapter]

	youtubeCategoryId: int
	youtubeId?:        string

	body?: string
}

#Chapter: {
	time:  string
	title: string
}
