const String getLatestVideosQuery = r'''
  query GetLatestVideos($limit: Int, $offset: Int) {
    getLatestVideos(limit: $limit, offset: $offset) {
      id
      title
      subtitle
      description
      slug
      thumbnailUrl
      streamUrl
      duration
      publishedAt
      likes
      episode {
        id
        code
        show {
          id
          name
        }
      }
      guests {
        id
        forename
        surname
      }
      technologies {
        id
        name
        logo
      }
    }
  }
''';

const String searchVideosQuery = r'''
  query SearchVideos($term: String!, $limit: Int) {
    simpleSearch(term: $term, limit: $limit) {
      id
      title
      subtitle
      description
      slug
      thumbnailUrl
      streamUrl
      duration
      publishedAt
      likes
      episode {
        id
        code
        show {
          id
          name
        }
      }
    }
  }
''';

const String getVideoByIdQuery = r'''
  query GetVideoById($id: String!) {
    videoByID(id: $id) {
      id
      title
      subtitle
      description
      slug
      thumbnailUrl
      streamUrl
      duration
      publishedAt
      likes
      chapters {
        title
        time
      }
      episode {
        id
        code
        show {
          id
          name
        }
      }
      guests {
        id
        forename
        surname
        biography
      }
      technologies {
        id
        name
        description
        logo
        website
      }
      creditsForRole {
        role
        person {
          id
          forename
          surname
        }
      }
    }
  }
''';

const String getRandomVideosQuery = r'''
  query GetRandomVideos($limit: Int) {
    getRandomVideos(limit: $limit) {
      id
      title
      subtitle
      description
      slug
      thumbnailUrl
      streamUrl
      duration
      publishedAt
      likes
      episode {
        id
        code
        show {
          id
          name
        }
      }
    }
  }
''';

const String getAllShowsQuery = r'''
  query GetAllShows {
    allShows {
      id
      name
      hosts {
        id
        forename
        surname
      }
    }
  }
''';

const String getEpisodesForShowQuery = r'''
  query GetEpisodesForShow($showId: String!) {
    episodesForShow(showId: $showId) {
      id
      code
      video {
        id
        title
        subtitle
        thumbnailUrl
        duration
        publishedAt
      }
    }
  }
''';