package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

type databaseClient struct {
	token string
}

func newDatabaseClient() *databaseClient {
	return &databaseClient{
		token: os.Getenv("LIBSQL_TOKEN"),
	}
}

func (c *databaseClient) getConnection(dbName string) (*sql.DB, error) {
	dbURL := fmt.Sprintf("%s-rawkodeacademy.turso.io", dbName)
	connStr := fmt.Sprintf("libsql://%s?authToken=%s", dbURL, c.token)
	return sql.Open("libsql", connStr)
}

func (c *databaseClient) getAllPeople() ([]Person, error) {
	db, err := c.getConnection("people")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, forename, surname FROM people")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var people []Person
	for rows.Next() {
		var p Person
		if err := rows.Scan(&p.ID, &p.Forename, &p.Surname); err != nil {
			continue
		}
		
		// Get biography from separate database
		bio, _ := c.getPersonBiography(p.ID)
		p.Biography = bio
		
		people = append(people, p)
	}

	return people, nil
}

func (c *databaseClient) getPersonBiography(personID string) (string, error) {
	db, err := c.getConnection("people-biographies")
	if err != nil {
		return "", err
	}
	defer db.Close()

	var biography string
	err = db.QueryRow("SELECT biography FROM people_biographies WHERE person_id = ?", personID).Scan(&biography)
	if err != nil {
		return "", nil // Return empty string if no biography found
	}
	return biography, nil
}

func (c *databaseClient) getAllVideosFromDB() ([]Video, error) {
	db, err := c.getConnection("videos")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	query := `
		SELECT id, title, subtitle, description, duration, publishedAt, slug
		FROM videos
		ORDER BY publishedAt DESC
		LIMIT 50
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []Video
	for rows.Next() {
		var v Video
		var publishedAt int64
		if err := rows.Scan(&v.ID, &v.Title, &v.Subtitle, &v.Description, &v.Duration, &publishedAt, &v.Slug); err != nil {
			continue
		}
		// Convert timestamp to date string
		v.PublishedAt = time.Unix(publishedAt, 0).Format("2006-01-02")
		videos = append(videos, v)
	}

	return videos, nil
}

func (c *databaseClient) getAllShowsFromDB() ([]Show, error) {
	db, err := c.getConnection("shows")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, name FROM shows")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shows []Show
	for rows.Next() {
		var s Show
		if err := rows.Scan(&s.ID, &s.Name); err != nil {
			continue
		}
		shows = append(shows, s)
	}

	return shows, nil
}

func (c *databaseClient) getAllEpisodesFromDB() ([]Episode, error) {
	db, err := c.getConnection("episodes")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, code FROM episodes")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var episodes []Episode
	for rows.Next() {
		var e Episode
		if err := rows.Scan(&e.ID, &e.Code); err != nil {
			continue
		}
		episodes = append(episodes, e)
	}

	return episodes, nil
}

func (c *databaseClient) getAllTechnologiesFromDB() ([]Technology, error) {
	db, err := c.getConnection("technologies")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, name, description, documentation, logo, website FROM technologies")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var technologies []Technology
	for rows.Next() {
		var t Technology
		var description, documentation, logo, website sql.NullString
		if err := rows.Scan(&t.ID, &t.Name, &description, &documentation, &logo, &website); err != nil {
			continue
		}
		if description.Valid {
			t.Description = description.String
		}
		if documentation.Valid {
			t.Documentation = documentation.String
		}
		if logo.Valid {
			t.Logo = logo.String
		}
		if website.Valid {
			t.Website = website.String
		}
		technologies = append(technologies, t)
	}

	return technologies, nil
}

// Association queries
func (c *databaseClient) getShowHosts(showID string) ([]string, error) {
	db, err := c.getConnection("show-hosts")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT person_id FROM show_hosts WHERE show_id = ?", showID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hostIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		hostIDs = append(hostIDs, id)
	}
	return hostIDs, nil
}

func (c *databaseClient) getVideoTechnologies(videoID string) ([]string, error) {
	db, err := c.getConnection("video-technologies")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT technology_id FROM video_technologies WHERE video_id = ?", videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var techIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		techIDs = append(techIDs, id)
	}
	return techIDs, nil
}

func (c *databaseClient) getVideoGuests(videoID string) ([]string, error) {
	db, err := c.getConnection("video-guests")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT person_id FROM video_guests WHERE video_id = ?", videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guestIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		guestIDs = append(guestIDs, id)
	}
	return guestIDs, nil
}

func (c *databaseClient) getPersonByID(id string) (*Person, error) {
	db, err := c.getConnection("people")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var p Person
	err = db.QueryRow("SELECT id, forename, surname FROM people WHERE id = ?", id).
		Scan(&p.ID, &p.Forename, &p.Surname)
	if err != nil {
		return nil, err
	}
	
	// Get biography from separate database
	bio, _ := c.getPersonBiography(p.ID)
	p.Biography = bio
	
	return &p, nil
}

func (c *databaseClient) getTechnologyByID(id string) (*Technology, error) {
	db, err := c.getConnection("technologies")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var t Technology
	var description, documentation, logo, website sql.NullString
	err = db.QueryRow("SELECT id, name, description, documentation, logo, website FROM technologies WHERE id = ?", id).
		Scan(&t.ID, &t.Name, &description, &documentation, &logo, &website)
	if err != nil {
		return nil, err
	}
	if description.Valid {
		t.Description = description.String
	}
	if documentation.Valid {
		t.Documentation = documentation.String
	}
	if logo.Valid {
		t.Logo = logo.String
	}
	if website.Valid {
		t.Website = website.String
	}
	return &t, nil
}

// Enhanced queries that include associations
func (c *databaseClient) getShowWithHosts(showID string) (*Show, error) {
	db, err := c.getConnection("shows")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var s Show
	err = db.QueryRow("SELECT id, name FROM shows WHERE id = ?", showID).Scan(&s.ID, &s.Name)
	if err != nil {
		return nil, err
	}

	// Get hosts
	hostIDs, err := c.getShowHosts(showID)
	if err == nil {
		for _, hostID := range hostIDs {
			if host, err := c.getPersonByID(hostID); err == nil {
				s.Hosts = append(s.Hosts, *host)
			}
		}
	}

	return &s, nil
}

func (c *databaseClient) getVideoWithAssociations(videoID string) (*Video, error) {
	db, err := c.getConnection("videos")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var v Video
	var publishedAt int64
	err = db.QueryRow(`
		SELECT id, title, subtitle, description, duration, publishedAt, slug
		FROM videos WHERE id = ?
	`, videoID).Scan(&v.ID, &v.Title, &v.Subtitle, &v.Description, &v.Duration, &publishedAt, &v.Slug)
	
	if err != nil {
		return nil, err
	}

	// Convert timestamp to date string
	v.PublishedAt = time.Unix(publishedAt, 0).Format("2006-01-02")

	// Get technologies
	techIDs, err := c.getVideoTechnologies(videoID)
	if err == nil {
		for _, techID := range techIDs {
			if tech, err := c.getTechnologyByID(techID); err == nil {
				v.Technologies = append(v.Technologies, *tech)
			}
		}
	}

	// Get episode info
	episodeDB, err := c.getConnection("episodes")
	if err == nil {
		defer episodeDB.Close()
		var e Episode
		err = episodeDB.QueryRow("SELECT id, code FROM episodes WHERE video_id = ?", videoID).Scan(&e.ID, &e.Code)
		if err == nil {
			v.Episode = &e
		}
	}

	return &v, nil
}