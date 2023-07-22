import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [selectedPage, setSelectedPage] = useState("Movies");
  const [movieName, setMovieName] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [actorName, setActorName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [years, setYears] = useState([]);
  const [movies, setMovies] = useState([]);
  const [actors, setActors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggeredBy, setTriggeredBy] = useState("initial");

  useEffect(() => {
    axios.get("http://localhost:5000/genres").then((response) => {
      setGenres(response.data);
    });

    axios.get("http://localhost:5000/years").then((response) => {
      setYears(response.data);
    });

    handleMovieSearch("initial");

    if (selectedPage === "Actors") {
      handleActorSearch();
    } else if (selectedPage === "Directors") {
      handleDirectorSearch();
    }
  }, [selectedPage]);

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
  };

  const handleMovieSearch = (triggeredBy) => {
    setMovies([]);
    setLoading(true);
    console.log(movies);

    const query = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX dbp: <http://dbpedia.org/property/>
    SELECT ?movie ?title ?date (GROUP_CONCAT(?directorName; SEPARATOR=", ") as ?directors) (GROUP_CONCAT(?actorName; SEPARATOR=", ") as ?actors)
    WHERE {
      ?movie rdf:type <http://dbpedia.org/ontology/Film> ;
            dbo:director ?director ;
            dbo:starring ?actor ;
            dbp:name ?title 
            ${selectedGenre ? `; dbo:wikiPageWikiLink dbr:${selectedGenre.split("/").pop()} .` : "."}
            OPTIONAL { ?movie <http://dbpedia.org/ontology/releaseDate> ?date . }
            OPTIONAL { ?actor dbp:name ?actorName . }
            OPTIONAL { ?director dbp:name ?directorName . }
            ${movieName ? `FILTER (CONTAINS(LCASE(str(?title)), LCASE("${movieName}")))` : "" }
            ${selectedYear ? `FILTER (CONTAINS(LCASE(str(?date)), LCASE("${selectedYear}")))` : ""}
    }
    GROUP BY ?movie ?title ?date
    LIMIT 100
    `;

    console.log(query);
  
    const dbpediaEndpoint = "http://dbpedia.org/sparql";
  
    axios.get(dbpediaEndpoint, {
      params: {
        query,
        format: "json",
      },
    })
    .then((response) => {
      const moviesData = response.data.results.bindings.map((result) => ({
        uri: result.movie.value,
        title: result.title.value,
        date: result.date?.value || null,
        directors: result.directors?.value || null,
        actors: result.actors?.value || null,
      }));
      setMovies(moviesData);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching movies:", error.message);
      setLoading(false);
    });

    setTriggeredBy(triggeredBy);
  };

  const handleActorSearch = () => {
    setLoading(true);
    const query = `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbp: <http://dbpedia.org/property/>
      SELECT ?actor ?name ?birthDate (GROUP_CONCAT(?movieName; SEPARATOR=", ") as ?movies) WHERE {
        ?movie dbo:starring ?actor .
        ?actor foaf:name ?name ;
        dbo:birthDate ?birthDate .
        FILTER(REGEX(?name, ".", "i"))
        ?movie dbp:name ?movieName .
      ${actorName ? `FILTER (CONTAINS(LCASE(?name ), LCASE("${actorName}")))` : ""}
      }
      GROUP BY ?actor ?name ?birthDate
      ORDER BY ?name
      LIMIT 25
    `;

    console.log(query);
  
    const dbpediaEndpoint = "http://dbpedia.org/sparql";
  
    axios
      .get(dbpediaEndpoint, {
        params: {
          query,
          format: "json",
        },
      })
      .then((response) => {
        const actorsData = response.data.results.bindings.map((result) => ({
          uri: result.actor.value,
          name: result.name.value,
          birthDate: result.birthDate.value,
          movies: result.movies.value
        }));
        setActors(actorsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching actors:", error.message);
        setLoading(false);
      });
  };

  const handleDirectorSearch = () => {
    setLoading(true);
    const query = `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbp: <http://dbpedia.org/property/>
      SELECT ?director ?name ?birthDate (GROUP_CONCAT(?movieName; SEPARATOR=", ") as ?movies) WHERE {
        ?movie dbp:director ?director .
        ?director foaf:name ?name ;
        dbo:birthDate ?birthDate .
        FILTER(REGEX(?name, ".", "i"))
        ?movie dbp:name ?movieName .
      ${directorName ? `FILTER (CONTAINS(LCASE(?name ), LCASE("${directorName}")))` : ""}
      }
      GROUP BY ?director ?name ?birthDate
      ORDER BY ?name
      LIMIT 25
    `;

    console.log(query);
  
    const dbpediaEndpoint = "http://dbpedia.org/sparql";
  
    axios
      .get(dbpediaEndpoint, {
        params: {
          query,
          format: "json",
        },
      })
      .then((response) => {
        const directorsData = response.data.results.bindings.map((result) => ({
          uri: result.director.value,
          name: result.name.value,
          birthDate: result.birthDate.value,
          movies: result.movies.value
        }));
        setDirectors(directorsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching directors:", error.message);
        setLoading(false);
      });
  };

  return (
    <div className="App">
      <nav className="navbar">
      <ul className="navbar-list">
          <li className={`navbar-item ${selectedPage === "Movies" ? "active" : ""}`}>
            <button className="nav-link" onClick={() => handlePageChange("Movies")}>
              Movies
            </button>
          </li>
          <li className={`navbar-item ${selectedPage === "Actors" ? "active" : ""}`}>
            <button className="nav-link" onClick={() => handlePageChange("Actors")}>
              Actors
            </button>
          </li>
          <li className={`navbar-item ${selectedPage === "Directors" ? "active" : ""}`}>
            <button className="nav-link" onClick={() => handlePageChange("Directors")}>
              Directors
            </button>
          </li>
        </ul>
      </nav>
      <div className="search-container">
      {selectedPage === "Movies" && (
        <>
        <input
          type="text"
          placeholder="Enter movie name"
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
        />
        <select value={selectedGenre} onChange={handleGenreChange}>
          <option value="">Select Genre</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre.split("/").pop().split("_")[0]}
            </option>
          ))}
        </select>
        <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button className="search-button" onClick={handleMovieSearch}>
              Search
            </button>
        </>
      ) }
      {selectedPage === "Actors" && (
          <>
            <input
              type="text"
              placeholder="Enter actor name"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
            />
            <button className="search-button" onClick={handleActorSearch}>
              Search
            </button>
          </>
        )}
        {selectedPage === "Directors" && (
          <>
            <input
              type="text"
              placeholder="Enter director name"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
            />
            <button className="search-button" onClick={handleDirectorSearch}>
              Search
            </button>
          </>
        )}
      </div>
      <div className="content">
        {/* Content for each page (Movies, Actors, Directors) can be added here. */}
        {selectedPage === "Movies" && (
          <> {loading ? (
            <div className="loading-bar">Loading...</div>
          ) : (
          <div className="movies-container">
            {movies.map((movie) => (
              <div key={movie.uri} className="movie-card">
                <h3>{movie.title}</h3>
                { movie.date != null ? <p>Date: <i><b>{movie.date}</b></i></p> : <></>}
                { movie.directors != null ? <p>Directors: <i><b>{[...new Set(movie.directors.split(", "))].join(", ")}</b></i></p> : <></>}
                { movie.actors != null ? <p>Actors: <i><b>{[...new Set(movie.actors.split(", "))].join(", ")}</b></i></p> : <></>}
              </div>
            ))} 
          </div>
          )}
          </>
        )}
        {selectedPage === "Actors" && (
        <>
          {loading ? (
            <div className="loading-bar">Loading...</div>
          ) : (
            <div className="actors-container">
              {actors.map((actor) => (
                <div key={actor.uri} className="actor-card">
                  <h3>{actor.name}</h3>
                  { actor.birthDate != null ? <p>Birth date: <i><b>{actor.birthDate}</b></i></p> : <></>}
                  { actor.movies != null ? <p>Movies: <i><b>{[...new Set(actor.movies.split(", "))].join(", ")}</b></i></p> : <></>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
        {selectedPage === "Directors" && (
        <>
          {loading ? (
            <div className="loading-bar">Loading...</div>
          ) : (
            <div className="directors-container">
              {directors.map((director) => (
                <div key={director.uri} className="director-card">
                  <h3>{director.name}</h3>
                  { director.birthDate != null ? <p>Birth date: <i><b>{director.birthDate}</b></i></p> : <></>}
                  { director.movies != null ? <p>Movies: <i><b>{[...new Set(director.movies.split(", "))].join(", ")}</b></i></p> : <></>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default App;
