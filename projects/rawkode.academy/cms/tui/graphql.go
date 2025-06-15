package main

import (
	"context"

	"github.com/machinebox/graphql"
)

const apiURL = "https://api.rawkode.academy/graphql"

type graphQLClient struct {
	client *graphql.Client
}

func newGraphQLClient() *graphQLClient {
	return &graphQLClient{
		client: graphql.NewClient(apiURL),
	}
}

// Data models based on the schema
type Video struct {
	ID           string       `json:"id"`
	Title        string       `json:"title"`
	Subtitle     string       `json:"subtitle"`
	Description  string       `json:"description"`
	Duration     int          `json:"duration"`
	PublishedAt  string       `json:"publishedAt"`
	Slug         string       `json:"slug"`
	StreamURL    string       `json:"streamUrl"`
	ThumbnailURL string       `json:"thumbnailUrl"`
	Likes        int          `json:"likes"`
	Episode      *Episode     `json:"episode"`
	Technologies []Technology `json:"technologies"`
	Chapters     []Chapter    `json:"chapters"`
	Guests       []Person     `json:"guests"`
}

type Show struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Hosts    []Person  `json:"hosts"`
	Episodes []Episode `json:"episodes"`
}

type Person struct {
	ID        string `json:"id"`
	Forename  string `json:"forename"`
	Surname   string `json:"surname"`
	Biography string `json:"biography"`
}

type Episode struct {
	ID    string `json:"id"`
	Code  string `json:"code"`
	Show  *Show  `json:"show"`
	Video *Video `json:"video"`
}

type Technology struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Documentation string   `json:"documentation"`
	Logo          string   `json:"logo"`
	Website       string   `json:"website"`
	Terms         []Term   `json:"terms"`
}

type Chapter struct {
	StartTime int    `json:"startTime"`
	Title     string `json:"title"`
}

type Term struct {
	Term string `json:"term"`
}

// Query methods
func (c *graphQLClient) getLatestVideos(limit int) ([]Video, error) {
	req := graphql.NewRequest(`
		query GetLatestVideos($limit: Int!) {
			getLatestVideos(limit: $limit) {
				id
				title
				subtitle
				description
				duration
				publishedAt
				slug
				streamUrl
				thumbnailUrl
				likes
			}
		}
	`)
	req.Var("limit", limit)

	var resp struct {
		GetLatestVideos []Video `json:"getLatestVideos"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	return resp.GetLatestVideos, nil
}

func (c *graphQLClient) getAllShows() ([]Show, error) {
	req := graphql.NewRequest(`
		query GetAllShows {
			allShows {
				id
				name
				hosts {
					id
					forename
					surname
				}
				episodes {
					id
					code
				}
			}
		}
	`)

	var resp struct {
		AllShows []Show `json:"allShows"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	return resp.AllShows, nil
}

func (c *graphQLClient) getTechnologies() ([]Technology, error) {
	req := graphql.NewRequest(`
		query GetTechnologies {
			getTechnologies {
				id
				name
				description
				documentation
				logo
				website
				terms {
					term
				}
			}
		}
	`)

	var resp struct {
		GetTechnologies []Technology `json:"getTechnologies"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	return resp.GetTechnologies, nil
}

func (c *graphQLClient) getVideoByID(id string) (*Video, error) {
	req := graphql.NewRequest(`
		query GetVideoByID($id: String!) {
			videoByID(id: $id) {
				id
				title
				subtitle
				description
				duration
				publishedAt
				slug
				streamUrl
				thumbnailUrl
				likes
				episode {
					id
					code
				}
				technologies {
					id
					name
				}
				chapters {
					startTime
					title
				}
				guests {
					id
					forename
					surname
					biography
				}
			}
		}
	`)
	req.Var("id", id)

	var resp struct {
		VideoByID *Video `json:"videoByID"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	return resp.VideoByID, nil
}

func (c *graphQLClient) getShowByID(id string) (*Show, error) {
	req := graphql.NewRequest(`
		query GetShowByID($id: String!) {
			showById(id: $id) {
				id
				name
				hosts {
					id
					forename
					surname
				}
				episodes {
					id
					code
				}
			}
		}
	`)
	req.Var("id", id)

	var resp struct {
		ShowById *Show `json:"showById"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	return resp.ShowById, nil
}

func (c *graphQLClient) getAllEpisodes() ([]Episode, error) {
	// Since there's no direct getAllEpisodes query, we'll get them from shows
	shows, err := c.getAllShows()
	if err != nil {
		return nil, err
	}
	
	var episodes []Episode
	for _, show := range shows {
		episodes = append(episodes, show.Episodes...)
	}
	
	return episodes, nil
}

func (c *graphQLClient) getPeopleFromVideos() ([]Person, error) {
	// Get people by fetching recent videos and extracting guests
	req := graphql.NewRequest(`
		query GetPeopleFromVideos {
			getLatestVideos(limit: 100) {
				guests {
					id
					forename
					surname
					biography
				}
			}
		}
	`)

	var resp struct {
		GetLatestVideos []struct {
			Guests []Person `json:"guests"`
		} `json:"getLatestVideos"`
	}

	ctx := context.Background()
	if err := c.client.Run(ctx, req, &resp); err != nil {
		return nil, err
	}

	// Deduplicate people
	peopleMap := make(map[string]Person)
	for _, video := range resp.GetLatestVideos {
		for _, guest := range video.Guests {
			peopleMap[guest.ID] = guest
		}
	}

	var people []Person
	for _, person := range peopleMap {
		people = append(people, person)
	}

	return people, nil
}