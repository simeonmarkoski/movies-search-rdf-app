const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());

app.get("/genres", async (req, res) => {
  try {
    const query = `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      SELECT DISTINCT ?genre
      WHERE {
        ?movie a dbo:Film ;
               dbo:genre ?genre .
      }
    `;
    const dbpediaEndpoint = "http://dbpedia.org/sparql";
    const response = await axios.get(dbpediaEndpoint, {
      params: {
        query,
        format: "json",
      },
    });

    const genres = response.data.results.bindings.map((result) => result.genre.value);

    res.json(genres);
  } catch (error) {
    console.error("Error fetching genres:", error.message);
    res.status(500).json({ error: "Failed to fetch genres from DBpedia" });
  }
});

app.get("/years", async (req, res) => {
    try {
      const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        SELECT DISTINCT ?year
        WHERE {
          ?movie a dbo:Film ;
                 dbo:releaseDate ?date .
          BIND(YEAR(?date) AS ?year)
        }
        ORDER BY DESC(?date)
      `;
      const dbpediaEndpoint = "http://dbpedia.org/sparql";
      const response = await axios.get(dbpediaEndpoint, {
        params: {
          query,
          format: "json",
        },
      });
  
      const years = response.data.results.bindings.map((result) => result.year.value);
  
      res.json(years);
    } catch (error) {
      console.error("Error fetching years:", error.message);
      res.status(500).json({ error: "Failed to fetch years from DBpedia" });
    }
  });

const port = 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
